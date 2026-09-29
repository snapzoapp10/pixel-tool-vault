import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
  return context.claims?.email ?? null;
}

async function log(db: any, actor: string | null, action: string, entity: string, entityId?: string, meta?: unknown) {
  await db.from("activity_log").insert({
    actor_email: actor,
    action,
    entity,
    entity_id: entityId ?? null,
    meta: meta ?? null,
  });
}

/* ---------- role bootstrap ---------- */

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const { count } = await db
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    return { isAdmin: Boolean(isAdmin), adminExists: Number(count ?? 0) > 0 };
  });

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const { count } = await db
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (Number(count ?? 0) > 0) throw new Error("An admin already exists for this store.");
    await db.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    await log(db, (context as any).claims?.email ?? null, "claimed first admin", "user_roles", context.userId);
    return { ok: true };
  });

/* ---------- overview ---------- */

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const [orders, products, customers, recent] = await Promise.all([
      db.from("orders").select("status, total, currency, created_at").gte("created_at", since),
      db.from("products").select("id, is_active"),
      db.from("profiles").select("id, created_at"),
      db
        .from("orders")
        .select("order_number, customer_name, total, currency, status, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    const rows = orders.data ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const paid = rows.filter((o) => o.status === "verified" || o.status === "delivered");
    const sum = (list: any[], cur: string) =>
      list.filter((o) => o.currency === cur).reduce((t, o) => t + Number(o.total), 0);
    return {
      pending: rows.filter((o) => o.status === "pending").length,
      todayOrders: rows.filter((o) => String(o.created_at).slice(0, 10) === today).length,
      monthOrders: rows.length,
      revenueBdt: sum(paid, "BDT"),
      revenueUsd: sum(paid, "USD"),
      productCount: (products.data ?? []).length,
      activeProducts: (products.data ?? []).filter((p) => p.is_active).length,
      customers: (customers.data ?? []).length,
      recent: recent.data ?? [],
    };
  });

/* ---------- products ---------- */

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const [prods, cats, vars, keys] = await Promise.all([
      db.from("products").select("*").order("sort_order"),
      db.from("categories").select("*").order("sort_order"),
      db.from("product_variants").select("*").order("sort_order"),
      db.from("license_keys").select("id, product_id, status"),
    ]);
    return {
      products: prods.data ?? [],
      categories: cats.data ?? [],
      variants: vars.data ?? [],
      keyCounts: (keys.data ?? []).reduce<Record<string, number>>((acc, k) => {
        if (k.status === "available") acc[k.product_id] = (acc[k.product_id] ?? 0) + 1;
        return acc;
      }, {}),
    };
  });

const variantSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(1),
  price_bdt: z.number().min(0),
  price_usd: z.number().min(0),
  compare_price_bdt: z.number().min(0).nullable().optional(),
  stock_qty: z.number().int().min(0),
  unlimited_stock: z.boolean(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
});

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        slug: z
          .string()
          .min(2)
          .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
        title: z.string().min(2),
        brand: z.string().optional().default(""),
        short_description: z.string().optional().default(""),
        long_description: z.string().optional().default(""),
        category_id: z.string().uuid().nullable().optional(),
        image_url: z.string().optional().default(""),
        delivery_mode: z.enum(["auto", "manual"]),
        delivery_time_text: z.string().min(1),
        terms: z.string().optional().default(""),
        seo_title: z.string().optional().default(""),
        seo_description: z.string().optional().default(""),
        is_active: z.boolean(),
        is_featured: z.boolean(),
        sort_order: z.number().int(),
        variants: z.array(variantSchema).min(1),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const { variants, id, ...fields } = data;
    const payload = { ...fields, updated_at: new Date().toISOString() };

    let productId = id ?? null;
    if (productId) {
      const { error } = await db.from("products").update(payload).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await db.from("products").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      productId = created.id;
    }

    const { data: existing } = await db.from("product_variants").select("id").eq("product_id", productId);
    const keepIds = variants.map((v) => v.id).filter(Boolean) as string[];
    const toDelete = (existing ?? []).map((v) => v.id).filter((vid) => !keepIds.includes(vid));
    if (toDelete.length) await db.from("product_variants").delete().in("id", toDelete);

    for (const v of variants) {
      const row = {
        product_id: productId,
        name: v.name,
        price_bdt: v.price_bdt,
        price_usd: v.price_usd,
        compare_price_bdt: v.compare_price_bdt ?? null,
        stock_qty: v.stock_qty,
        unlimited_stock: v.unlimited_stock,
        sort_order: v.sort_order,
        is_active: v.is_active,
      };
      if (v.id) await db.from("product_variants").update(row).eq("id", v.id);
      else await db.from("product_variants").insert(row);
    }

    await log(db, actor, id ? "updated product" : "created product", "products", productId!, { slug: data.slug });
    return { id: productId };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    await db.from("products").delete().eq("id", data.id);
    await log(db, actor, "deleted product", "products", data.id);
    return { ok: true };
  });

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
        name: z.string().min(2),
        description: z.string().optional().default(""),
        sort_order: z.number().int(),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const { id, ...fields } = data;
    if (id) await db.from("categories").update(fields).eq("id", id);
    else await db.from("categories").insert(fields);
    await log(db, actor, id ? "updated category" : "created category", "categories", id ?? data.slug);
    return { ok: true };
  });

/* ---------- license key stock ---------- */

export const adminListKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const [keys, prods, orders] = await Promise.all([
      db.from("license_keys").select("*").order("created_at", { ascending: false }).limit(500),
      db.from("products").select("id, title, delivery_mode").order("title"),
      db.from("orders").select("id, order_number"),
    ]);
    const orderMap = new Map((orders.data ?? []).map((o) => [o.id, o.order_number]));
    return {
      keys: (keys.data ?? []).map((k) => ({ ...k, order_number: k.order_id ? orderMap.get(k.order_id) : null })),
      products: prods.data ?? [],
    };
  });

export const adminAddKeys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; values: string }) =>
    z.object({ productId: z.string().uuid(), values: z.string().min(1) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const rows = data.values
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((secret_value) => ({ product_id: data.productId, secret_value }));
    if (!rows.length) throw new Error("No keys provided.");
    const { error } = await db.from("license_keys").insert(rows);
    if (error) throw new Error(error.message);
    await log(db, actor, `added ${rows.length} license key(s)`, "license_keys", data.productId);
    return { added: rows.length };
  });

export const adminDeleteKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    await db.from("license_keys").delete().eq("id", data.id).eq("status", "available");
    await log(db, actor, "deleted license key", "license_keys", data.id);
    return { ok: true };
  });

/* ---------- orders ---------- */

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; q?: string } | undefined) =>
    z.object({ status: z.string().optional(), q: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    let query = db.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    const { data: orders } = await query;
    let list = orders ?? [];
    if (data.q) {
      const q = data.q.toLowerCase();
      list = list.filter(
        (o) =>
          String(o.order_number).toLowerCase().includes(q) ||
          String(o.customer_email).toLowerCase().includes(q) ||
          String(o.customer_name).toLowerCase().includes(q) ||
          String(o.txn_id ?? "").toLowerCase().includes(q),
      );
    }
    const ids = list.map((o) => o.id);
    const { data: items } = ids.length
      ? await db.from("order_items").select("*").in("order_id", ids)
      : { data: [] as any[] };
    return {
      orders: list.map((o) => ({ ...o, items: (items ?? []).filter((i) => i.order_id === o.id) })),
    };
  });

export const adminProofUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { path: string }) => z.object({ path: z.string().min(1) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const { data: signed } = await db.storage.from("payment-proofs").createSignedUrl(data.path, 600);
    return { url: signed?.signedUrl ?? null };
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "verified", "delivered", "rejected", "cancelled"]).optional(),
        admin_note: z.string().optional(),
        reject_reason: z.string().optional(),
        delivered_content: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();

    const { data: order } = await db.from("orders").select("*").eq("id", data.id).maybeSingle();
    if (!order) throw new Error("Order not found.");

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.status) update["status"] = data.status;
    if (data.admin_note !== undefined) update["admin_note"] = data.admin_note;
    if (data.reject_reason !== undefined) update["reject_reason"] = data.reject_reason;
    if (data.delivered_content !== undefined) update["delivered_content"] = data.delivered_content;

    // Auto delivery: when payment is verified, hand out stocked keys for auto products.
    if (data.status === "verified" && !order.delivered_content) {
      const { data: items } = await db.from("order_items").select("*").eq("order_id", order.id);
      const delivered: string[] = [];
      for (const item of items ?? []) {
        const { data: product } = await db
          .from("products")
          .select("id, delivery_mode")
          .eq("id", item.product_id)
          .maybeSingle();
        if (product?.delivery_mode !== "auto") continue;
        const { data: keys } = await db
          .from("license_keys")
          .select("id, secret_value")
          .eq("product_id", product.id)
          .eq("status", "available")
          .limit(item.quantity);
        if (!keys || keys.length < item.quantity) continue;
        await db
          .from("license_keys")
          .update({ status: "delivered", order_id: order.id, delivered_at: new Date().toISOString() })
          .in(
            "id",
            keys.map((k) => k.id),
          );
        const text = keys.map((k) => k.secret_value).join("\n");
        await db.from("order_items").update({ delivered_content: text }).eq("id", item.id);
        delivered.push(`${item.product_title} — ${item.variant_name}:\n${text}`);
      }
      if (delivered.length) {
        update["delivered_content"] = delivered.join("\n\n");
        update["status"] = "delivered";
      }
    }

    // Reduce stock counters when the order is fulfilled.
    if ((update["status"] === "delivered" || update["status"] === "verified") && order.status === "pending") {
      const { data: items } = await db.from("order_items").select("variant_id, quantity").eq("order_id", order.id);
      for (const item of items ?? []) {
        if (!item.variant_id) continue;
        const { data: v } = await db
          .from("product_variants")
          .select("stock_qty, unlimited_stock")
          .eq("id", item.variant_id)
          .maybeSingle();
        if (v && !v.unlimited_stock) {
          await db
            .from("product_variants")
            .update({ stock_qty: Math.max(0, Number(v.stock_qty) - Number(item.quantity)) })
            .eq("id", item.variant_id);
        }
      }
    }

    const { error } = await db.from("orders").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    await log(db, actor, `order ${String(update["status"] ?? "updated")}`, "orders", order.order_number);
    return { ok: true, status: update["status"] ?? order.status };
  });

/* ---------- customers ---------- */

export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const [profiles, orders] = await Promise.all([
      db.from("profiles").select("*").order("created_at", { ascending: false }),
      db.from("orders").select("customer_email, customer_name, customer_phone, total, currency, status, created_at"),
    ]);
    const rows = orders.data ?? [];
    const byEmail = new Map<string, any>();
    for (const p of profiles.data ?? []) {
      byEmail.set(String(p.email ?? "").toLowerCase(), {
        email: p.email,
        name: p.full_name,
        phone: p.phone,
        has_account: true,
        is_blocked: p.is_blocked,
        profile_id: p.id,
        created_at: p.created_at,
        orders: 0,
        spent_bdt: 0,
        spent_usd: 0,
        last_order: null as string | null,
      });
    }
    for (const o of rows) {
      const key = String(o.customer_email).toLowerCase();
      const entry =
        byEmail.get(key) ??
        {
          email: o.customer_email,
          name: o.customer_name,
          phone: o.customer_phone,
          has_account: false,
          is_blocked: false,
          profile_id: null,
          created_at: o.created_at,
          orders: 0,
          spent_bdt: 0,
          spent_usd: 0,
          last_order: null as string | null,
        };
      entry.orders += 1;
      if (o.status === "verified" || o.status === "delivered") {
        if (o.currency === "BDT") entry.spent_bdt += Number(o.total);
        else entry.spent_usd += Number(o.total);
      }
      if (!entry.last_order || o.created_at > entry.last_order) entry.last_order = o.created_at;
      byEmail.set(key, entry);
    }
    return { customers: [...byEmail.values()].sort((a, b) => (a.last_order! < b.last_order! ? 1 : -1)) };
  });

export const adminToggleBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { profileId: string; blocked: boolean }) =>
    z.object({ profileId: z.string().uuid(), blocked: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    await db.from("profiles").update({ is_blocked: data.blocked }).eq("id", data.profileId);
    await log(db, actor, data.blocked ? "blocked customer" : "unblocked customer", "profiles", data.profileId);
    return { ok: true };
  });

/* ---------- coupons, payment methods, reviews, settings, blog ---------- */

export const adminListMisc = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const [coupons, methods, reviews, settings, posts, activity, products] = await Promise.all([
      db.from("coupons").select("*").order("created_at", { ascending: false }),
      db.from("payment_methods").select("*").order("sort_order"),
      db.from("reviews").select("*").order("created_at", { ascending: false }),
      db.from("site_settings").select("*").eq("key", "general").maybeSingle(),
      db.from("blog_posts").select("*").order("created_at", { ascending: false }),
      db.from("activity_log").select("*").order("created_at", { ascending: false }).limit(60),
      db.from("products").select("id, title").order("title"),
    ]);
    return {
      coupons: coupons.data ?? [],
      methods: methods.data ?? [],
      reviews: reviews.data ?? [],
      settings: (settings.data?.value as Record<string, unknown>) ?? {},
      posts: posts.data ?? [],
      activity: activity.data ?? [],
      products: products.data ?? [],
    };
  });

export const adminSaveCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        code: z.string().min(2).max(40),
        discount_type: z.enum(["percent", "fixed"]),
        value: z.number().min(0),
        max_uses: z.number().int().min(1).nullable().optional(),
        expires_at: z.string().nullable().optional(),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const { id, ...fields } = data;
    const row = {
      ...fields,
      code: fields.code.toUpperCase(),
      max_uses: fields.max_uses ?? null,
      expires_at: fields.expires_at || null,
    };
    if (id) await db.from("coupons").update(row).eq("id", id);
    else await db.from("coupons").insert(row);
    await log(db, actor, id ? "updated coupon" : "created coupon", "coupons", row.code);
    return { ok: true };
  });

export const adminDeleteRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { table: string; id: string }) =>
    z
      .object({
        table: z.enum(["coupons", "reviews", "blog_posts", "categories", "payment_methods"]),
        id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    await db.from(data.table).delete().eq("id", data.id);
    await log(db, actor, `deleted ${data.table} row`, data.table, data.id);
    return { ok: true };
  });

export const adminSavePaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        key: z.string().min(2).regex(/^[a-z0-9-]+$/),
        name: z.string().min(2),
        kind: z.enum(["mobile", "crypto"]),
        account_value: z.string().optional().default(""),
        network: z.string().optional().default(""),
        instructions: z.string().optional().default(""),
        is_active: z.boolean(),
        sort_order: z.number().int(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const { id, ...fields } = data;
    if (id) await db.from("payment_methods").update(fields).eq("id", id);
    else await db.from("payment_methods").insert(fields);
    await log(db, actor, id ? "updated payment method" : "added payment method", "payment_methods", data.key);
    return { ok: true };
  });

export const adminSaveReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        product_id: z.string().uuid().nullable().optional(),
        author_name: z.string().min(2),
        rating: z.number().int().min(1).max(5),
        body: z.string().optional().default(""),
        is_approved: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const { id, ...fields } = data;
    const row = { ...fields, product_id: fields.product_id || null };
    if (id) await db.from("reviews").update(row).eq("id", id);
    else await db.from("reviews").insert(row);
    await log(db, actor, id ? "updated review" : "added review", "reviews", id ?? data.author_name);
    return { ok: true };
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        site_name: z.string().min(1),
        tagline: z.string().optional().default(""),
        support_hours: z.string().optional().default(""),
        whatsapp: z.string().optional().default(""),
        messenger: z.string().optional().default(""),
        email: z.string().optional().default(""),
        usd_to_bdt: z.number().min(1),
        announcement: z.string().optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    await db
      .from("site_settings")
      .upsert({ key: "general", value: data, updated_at: new Date().toISOString() }, { onConflict: "key" });
    await log(db, actor, "updated site settings", "site_settings", "general");
    return { ok: true };
  });

export const adminSavePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable().optional(),
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
        title: z.string().min(2),
        excerpt: z.string().optional().default(""),
        content: z.string().optional().default(""),
        cover_url: z.string().optional().default(""),
        seo_title: z.string().optional().default(""),
        seo_description: z.string().optional().default(""),
        is_published: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const actor = await assertAdmin(context);
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const { id, ...fields } = data;
    if (id) await db.from("blog_posts").update(fields).eq("id", id);
    else await db.from("blog_posts").insert(fields);
    await log(db, actor, id ? "updated post" : "created post", "blog_posts", data.slug);
    return { ok: true };
  });

/* ---------- customer account ---------- */

export const myOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: orders } = await context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    const ids = (orders ?? []).map((o: any) => o.id);
    const { data: items } = ids.length
      ? await context.supabase.from("order_items").select("*").in("order_id", ids)
      : { data: [] as any[] };
    return {
      orders: (orders ?? []).map((o: any) => ({
        ...o,
        items: (items ?? []).filter((i: any) => i.order_id === o.id),
      })),
    };
  });
