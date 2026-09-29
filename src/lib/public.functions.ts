import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type SiteSettings = {
  site_name: string;
  tagline: string;
  support_hours: string;
  whatsapp: string;
  messenger: string;
  email: string;
  usd_to_bdt: number;
  announcement: string;
};

const defaultSettings: SiteSettings = {
  site_name: "Pixel Line",
  tagline: "Genuine AI subscriptions, credits & tool licenses",
  support_hours: "10 AM - 2 AM (BD time)",
  whatsapp: "",
  messenger: "",
  email: "support@pixelline.shop",
  usd_to_bdt: 122,
  announcement: "",
};

export type VariantLite = {
  id: string;
  name: string;
  price_bdt: number;
  price_usd: number;
  compare_price_bdt: number | null;
  stock_qty: number;
  unlimited_stock: boolean;
};

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  short_description: string | null;
  image_url: string | null;
  delivery_time_text: string;
  delivery_mode: string;
  is_featured: boolean;
  category_slug: string | null;
  category_name: string | null;
  from_bdt: number;
  from_usd: number;
  compare_bdt: number | null;
  in_stock: boolean;
};

type RawVariant = VariantLite & { product_id: string; sort_order: number };

function toCards(products: any[], variants: RawVariant[], categories: any[]): ProductCardData[] {
  const catById = new Map(categories.map((c) => [c.id, c]));
  return products.map((p) => {
    const vs = variants
      .filter((v) => v.product_id === p.id)
      .sort((a, b) => Number(a.price_bdt) - Number(b.price_bdt));
    const first = vs[0];
    const cat = p.category_id ? catById.get(p.category_id) : null;
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      brand: p.brand,
      short_description: p.short_description,
      image_url: p.image_url,
      delivery_time_text: p.delivery_time_text,
      delivery_mode: p.delivery_mode,
      is_featured: p.is_featured,
      category_slug: cat?.slug ?? null,
      category_name: cat?.name ?? null,
      from_bdt: Number(first?.price_bdt ?? 0),
      from_usd: Number(first?.price_usd ?? 0),
      compare_bdt: first?.compare_price_bdt ? Number(first.compare_price_bdt) : null,
      in_stock: vs.some((v) => v.unlimited_stock || Number(v.stock_qty) > 0),
    };
  });
}

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./sb.server");
  const db = publicDb();
  const [settingsRes, catRes, prodRes, varRes, revRes] = await Promise.all([
    db.from("site_settings").select("key, value").eq("key", "general").maybeSingle(),
    db.from("categories").select("id, slug, name, description, sort_order").order("sort_order"),
    db
      .from("products")
      .select(
        "id, slug, title, brand, short_description, image_url, delivery_time_text, delivery_mode, is_featured, category_id, sort_order",
      )
      .order("sort_order"),
    db
      .from("product_variants")
      .select(
        "id, product_id, name, price_bdt, price_usd, compare_price_bdt, stock_qty, unlimited_stock, sort_order",
      ),
    db
      .from("reviews")
      .select("id, author_name, rating, body, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const settings = { ...defaultSettings, ...((settingsRes.data?.value as object) ?? {}) } as SiteSettings;
  const categories = catRes.data ?? [];
  const cards = toCards(prodRes.data ?? [], (varRes.data ?? []) as RawVariant[], categories);

  return {
    settings,
    categories: categories.map((c) => ({
      slug: c.slug as string,
      name: c.name as string,
      description: (c.description as string) ?? "",
      count: cards.filter((p) => p.category_slug === c.slug).length,
    })),
    featured: cards.filter((p) => p.is_featured).slice(0, 6),
    latest: cards.slice(0, 8),
    reviews: revRes.data ?? [],
  };
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string; q?: string; sort?: string }) =>
    z
      .object({ category: z.string().optional(), q: z.string().optional(), sort: z.string().optional() })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { publicDb } = await import("./sb.server");
    const db = publicDb();
    const [catRes, prodRes, varRes] = await Promise.all([
      db.from("categories").select("id, slug, name, description, sort_order").order("sort_order"),
      db
        .from("products")
        .select(
          "id, slug, title, brand, short_description, image_url, delivery_time_text, delivery_mode, is_featured, category_id, sort_order",
        )
        .order("sort_order"),
      db
        .from("product_variants")
        .select(
          "id, product_id, name, price_bdt, price_usd, compare_price_bdt, stock_qty, unlimited_stock, sort_order",
        ),
    ]);

    const categories = catRes.data ?? [];
    let cards = toCards(prodRes.data ?? [], (varRes.data ?? []) as RawVariant[], categories);

    if (data.category) cards = cards.filter((p) => p.category_slug === data.category);
    if (data.q) {
      const q = data.q.toLowerCase();
      cards = cards.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q) ||
          (p.short_description ?? "").toLowerCase().includes(q),
      );
    }
    if (data.sort === "price-asc") cards.sort((a, b) => a.from_bdt - b.from_bdt);
    if (data.sort === "price-desc") cards.sort((a, b) => b.from_bdt - a.from_bdt);

    return {
      products: cards,
      categories: categories.map((c) => ({ slug: c.slug as string, name: c.name as string })),
    };
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { publicDb } = await import("./sb.server");
    const db = publicDb();
    const { data: product } = await db
      .from("products")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!product) return null;

    const [varRes, revRes, catRes, relRes, setRes] = await Promise.all([
      db
        .from("product_variants")
        .select("id, name, price_bdt, price_usd, compare_price_bdt, stock_qty, unlimited_stock, sort_order")
        .eq("product_id", product.id)
        .order("sort_order"),
      db
        .from("reviews")
        .select("id, author_name, rating, body, created_at")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false }),
      db.from("categories").select("id, slug, name").order("sort_order"),
      db
        .from("products")
        .select(
          "id, slug, title, brand, short_description, image_url, delivery_time_text, delivery_mode, is_featured, category_id",
        )
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(3),
      db.from("site_settings").select("value").eq("key", "general").maybeSingle(),
    ]);

    const categories = catRes.data ?? [];
    const relIds = (relRes.data ?? []).map((r) => r.id);
    const relVars = relIds.length
      ? (
          await db
            .from("product_variants")
            .select(
              "id, product_id, name, price_bdt, price_usd, compare_price_bdt, stock_qty, unlimited_stock, sort_order",
            )
            .in("product_id", relIds)
        ).data ?? []
      : [];

    const category = categories.find((c) => c.id === product.category_id) ?? null;

    return {
      product: {
        ...product,
        category_slug: category?.slug ?? null,
        category_name: category?.name ?? null,
      },
      variants: (varRes.data ?? []).map((v) => ({
        ...v,
        price_bdt: Number(v.price_bdt),
        price_usd: Number(v.price_usd),
        compare_price_bdt: v.compare_price_bdt ? Number(v.compare_price_bdt) : null,
      })) as VariantLite[],
      reviews: revRes.data ?? [],
      related: toCards(relRes.data ?? [], relVars as RawVariant[], categories),
      settings: { ...defaultSettings, ...((setRes.data?.value as object) ?? {}) } as SiteSettings,
    };
  });

export const getCheckoutData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { publicDb } = await import("./sb.server");
    const db = publicDb();
    const { data: product } = await db
      .from("products")
      .select("id, slug, title, image_url, delivery_time_text, delivery_mode, terms")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!product) return null;
    const [varRes, payRes, setRes] = await Promise.all([
      db
        .from("product_variants")
        .select("id, name, price_bdt, price_usd, stock_qty, unlimited_stock, sort_order")
        .eq("product_id", product.id)
        .order("sort_order"),
      db
        .from("payment_methods")
        .select("key, name, kind, account_value, network, instructions, sort_order")
        .order("sort_order"),
      db.from("site_settings").select("value").eq("key", "general").maybeSingle(),
    ]);
    return {
      product,
      variants: (varRes.data ?? []).map((v) => ({
        ...v,
        price_bdt: Number(v.price_bdt),
        price_usd: Number(v.price_usd),
      })),
      methods: payRes.data ?? [],
      settings: { ...defaultSettings, ...((setRes.data?.value as object) ?? {}) } as SiteSettings,
    };
  });

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./sb.server");
  const db = publicDb();
  const { data } = await db.from("site_settings").select("value").eq("key", "general").maybeSingle();
  return { ...defaultSettings, ...((data?.value as object) ?? {}) } as SiteSettings;
});

export const listBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./sb.server");
  const db = publicDb();
  const { data } = await db
    .from("blog_posts")
    .select("slug, title, excerpt, cover_url, published_at")
    .order("published_at", { ascending: false });
  return data ?? [];
});

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { publicDb } = await import("./sb.server");
    const db = publicDb();
    const { data: post } = await db.from("blog_posts").select("*").eq("slug", data.slug).maybeSingle();
    return post ?? null;
  });

/* ---------------- Orders (public) ---------------- */

const orderInput = z.object({
  slug: z.string().min(1),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  currency: z.enum(["BDT", "USD"]),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().default(""),
  note: z.string().max(1000).optional().default(""),
  couponCode: z.string().max(40).optional().default(""),
  methodKey: z.string().min(1),
  txnId: z.string().min(3).max(120),
  senderAccount: z.string().max(120).optional().default(""),
  userId: z.string().uuid().nullable().optional(),
  proof: z
    .object({ name: z.string(), type: z.string(), base64: z.string() })
    .nullable()
    .optional(),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderInput.parse(d))
  .handler(async ({ data }) => {
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();

    const { data: product } = await db
      .from("products")
      .select("id, title, slug, is_active, delivery_mode")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!product || !product.is_active) throw new Error("This product is no longer available.");

    const { data: variant } = await db
      .from("product_variants")
      .select("id, name, price_bdt, price_usd, stock_qty, unlimited_stock, is_active, product_id")
      .eq("id", data.variantId)
      .maybeSingle();
    if (!variant || !variant.is_active || variant.product_id !== product.id) {
      throw new Error("Selected plan is not available.");
    }
    if (!variant.unlimited_stock && Number(variant.stock_qty) < data.quantity) {
      throw new Error("Not enough stock for the selected plan.");
    }

    const { data: method } = await db
      .from("payment_methods")
      .select("key, name, is_active")
      .eq("key", data.methodKey)
      .maybeSingle();
    if (!method || !method.is_active) throw new Error("Selected payment method is unavailable.");

    const unitPrice = data.currency === "BDT" ? Number(variant.price_bdt) : Number(variant.price_usd);
    const subtotal = Number((unitPrice * data.quantity).toFixed(2));

    let discount = 0;
    let appliedCoupon: string | null = null;
    const code = (data.couponCode ?? "").trim().toUpperCase();
    if (code) {
      const { data: coupon } = await db
        .from("coupons")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      const valid =
        coupon &&
        coupon.is_active &&
        (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) &&
        (coupon.max_uses === null || Number(coupon.used_count) < Number(coupon.max_uses));
      if (!valid) throw new Error("Coupon code is invalid or expired.");
      discount =
        coupon!.discount_type === "percent"
          ? Number(((subtotal * Number(coupon!.value)) / 100).toFixed(2))
          : Math.min(subtotal, Number(coupon!.value));
      appliedCoupon = code;
    }

    const total = Number(Math.max(0, subtotal - discount).toFixed(2));

    let proofPath: string | null = null;
    if (data.proof?.base64) {
      const bytes = Uint8Array.from(atob(data.proof.base64), (c) => c.charCodeAt(0));
      const ext = (data.proof.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const up = await db.storage
        .from("payment-proofs")
        .upload(path, bytes, { contentType: data.proof.type || "image/jpeg" });
      if (!up.error) proofPath = path;
    }

    const { data: order, error } = await db
      .from("orders")
      .insert({
        user_id: data.userId ?? null,
        customer_name: data.name,
        customer_email: data.email.toLowerCase(),
        customer_phone: data.phone,
        customer_note: data.note,
        currency: data.currency,
        subtotal,
        discount,
        total,
        coupon_code: appliedCoupon,
        payment_method_key: method.key,
        payment_method_name: method.name,
        txn_id: data.txnId,
        sender_account: data.senderAccount,
        proof_path: proofPath,
        status: "pending",
      })
      .select("id, order_number")
      .single();
    if (error || !order) throw new Error("Could not place the order. Please try again.");

    await db.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      variant_id: variant.id,
      product_title: product.title,
      variant_name: variant.name,
      unit_price: unitPrice,
      quantity: data.quantity,
      line_total: subtotal,
    });

    if (appliedCoupon) {
      await db.rpc("noop").then(
        () => undefined,
        () => undefined,
      );
      const { data: c } = await db.from("coupons").select("used_count").eq("code", appliedCoupon).maybeSingle();
      await db
        .from("coupons")
        .update({ used_count: Number(c?.used_count ?? 0) + 1 })
        .eq("code", appliedCoupon);
    }

    return { orderNumber: order.order_number as string, email: data.email.toLowerCase() };
  });

export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { orderNumber: string; email: string }) =>
    z.object({ orderNumber: z.string().min(3), email: z.string().email() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const { data: order } = await db
      .from("orders")
      .select(
        "order_number, customer_name, customer_email, currency, subtotal, discount, total, coupon_code, payment_method_name, txn_id, status, reject_reason, delivered_content, created_at, updated_at, id",
      )
      .eq("order_number", data.orderNumber.trim().toUpperCase())
      .eq("customer_email", data.email.trim().toLowerCase())
      .maybeSingle();
    if (!order) return null;
    const { data: items } = await db
      .from("order_items")
      .select("product_title, variant_name, unit_price, quantity, line_total, delivered_content")
      .eq("order_id", order.id);
    const { id, ...safe } = order;
    return { order: safe, items: items ?? [] };
  });

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; subtotal: number }) =>
    z.object({ code: z.string().min(1).max(40), subtotal: z.number().min(0) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { adminDb } = await import("./sb.server");
    const db = await adminDb();
    const code = data.code.trim().toUpperCase();
    const { data: coupon } = await db.from("coupons").select("*").eq("code", code).maybeSingle();
    const valid =
      coupon &&
      coupon.is_active &&
      (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) &&
      (coupon.max_uses === null || Number(coupon.used_count) < Number(coupon.max_uses));
    if (!valid) return { ok: false as const, message: "Coupon is invalid or expired." };
    const discount =
      coupon!.discount_type === "percent"
        ? Number(((data.subtotal * Number(coupon!.value)) / 100).toFixed(2))
        : Math.min(data.subtotal, Number(coupon!.value));
    return { ok: true as const, code, discount };
  });
