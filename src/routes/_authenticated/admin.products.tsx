import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteProduct,
  adminListProducts,
  adminSaveCategory,
  adminSaveProduct,
} from "@/lib/admin.functions";
import { formatMoney } from "@/lib/format";
import { Btn, Empty, Field, Panel, Td, TableWrap, Th, Toggle, areaClass, inputClass } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: Products,
});

type VariantDraft = {
  id?: string | null;
  name: string;
  price_bdt: number;
  price_usd: number;
  compare_price_bdt: number | null;
  stock_qty: number;
  unlimited_stock: boolean;
  sort_order: number;
  is_active: boolean;
};

type Draft = {
  id: string | null;
  slug: string;
  title: string;
  brand: string;
  short_description: string;
  long_description: string;
  category_id: string | null;
  image_url: string;
  delivery_mode: "auto" | "manual";
  delivery_time_text: string;
  terms: string;
  seo_title: string;
  seo_description: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  variants: VariantDraft[];
};

const emptyVariant = (sort = 0): VariantDraft => ({
  name: "1 Month",
  price_bdt: 0,
  price_usd: 0,
  compare_price_bdt: null,
  stock_qty: 0,
  unlimited_stock: true,
  sort_order: sort,
  is_active: true,
});

const emptyDraft = (): Draft => ({
  id: null,
  slug: "",
  title: "",
  brand: "",
  short_description: "",
  long_description: "",
  category_id: null,
  image_url: "",
  delivery_mode: "manual",
  delivery_time_text: "Within 5-30 minutes",
  terms: "",
  seo_title: "",
  seo_description: "",
  is_active: true,
  is_featured: false,
  sort_order: 0,
  variants: [emptyVariant()],
});

function Products() {
  const listFn = useServerFn(adminListProducts);
  const saveFn = useServerFn(adminSaveProduct);
  const deleteFn = useServerFn(adminDeleteProduct);
  const catFn = useServerFn(adminSaveCategory);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => listFn({}) });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [cat, setCat] = useState({ slug: "", name: "", description: "", sort_order: 0, is_active: true });
  const [busy, setBusy] = useState(false);

  function edit(p: any) {
    setDraft({
      id: p.id,
      slug: p.slug,
      title: p.title,
      brand: p.brand ?? "",
      short_description: p.short_description ?? "",
      long_description: p.long_description ?? "",
      category_id: p.category_id ?? null,
      image_url: p.image_url ?? "",
      delivery_mode: p.delivery_mode,
      delivery_time_text: p.delivery_time_text,
      terms: p.terms ?? "",
      seo_title: p.seo_title ?? "",
      seo_description: p.seo_description ?? "",
      is_active: p.is_active,
      is_featured: p.is_featured,
      sort_order: p.sort_order,
      variants: (data?.variants ?? [])
        .filter((v: any) => v.product_id === p.id)
        .map((v: any) => ({
          id: v.id,
          name: v.name,
          price_bdt: Number(v.price_bdt),
          price_usd: Number(v.price_usd),
          compare_price_bdt: v.compare_price_bdt === null ? null : Number(v.compare_price_bdt),
          stock_qty: v.stock_qty,
          unlimited_stock: v.unlimited_stock,
          sort_order: v.sort_order,
          is_active: v.is_active,
        })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      await saveFn({ data: { ...draft, variants: draft.variants } as any });
      toast.success("Product saved.");
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the product.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Product deleted.");
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch {
      toast.error("Could not delete the product.");
    }
  }

  const V = (i: number, patch: Partial<VariantDraft>) =>
    setDraft((d) =>
      d ? { ...d, variants: d.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) } : d,
    );

  return (
    <>
      {draft ? (
        <Panel
          title={draft.id ? `Edit ${draft.title || "product"}` : "Add a product"}
          description="Prices, delivery mode and SEO text all live here."
          action={
            <Btn variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Btn>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                value={draft.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    title: e.target.value,
                    slug:
                      draft.id || draft.slug
                        ? draft.slug
                        : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field label="URL slug" hint="Used in the Google-friendly link: /product/your-slug">
              <input
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Brand">
              <input
                value={draft.brand}
                onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Category">
              <select
                value={draft.category_id ?? ""}
                onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}
                className={inputClass}
              >
                <option value="">No category</option>
                {(data?.categories ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Image URL" hint="Paste a direct image link (jpg/png/webp).">
              <input
                value={draft.image_url}
                onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Delivery mode" hint="Auto hands out a stored license key the moment you verify payment.">
              <select
                value={draft.delivery_mode}
                onChange={(e) => setDraft({ ...draft, delivery_mode: e.target.value as "auto" | "manual" })}
                className={inputClass}
              >
                <option value="manual">Manual — you deliver</option>
                <option value="auto">Auto — from license stock</option>
              </select>
            </Field>
            <Field label="Delivery time text">
              <input
                value={draft.delivery_time_text}
                onChange={(e) => setDraft({ ...draft, delivery_time_text: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={draft.sort_order}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Short description">
              <textarea
                value={draft.short_description}
                onChange={(e) => setDraft({ ...draft, short_description: e.target.value })}
                className={areaClass}
              />
            </Field>
            <Field label="Full description">
              <textarea
                value={draft.long_description}
                onChange={(e) => setDraft({ ...draft, long_description: e.target.value })}
                className={areaClass}
              />
            </Field>
            <Field label="Terms / what the customer must know">
              <textarea
                value={draft.terms}
                onChange={(e) => setDraft({ ...draft, terms: e.target.value })}
                className={areaClass}
              />
            </Field>
            <div className="space-y-3">
              <Field label="SEO title" hint="Shown as the Google result headline.">
                <input
                  value={draft.seo_title}
                  onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="SEO description">
                <textarea
                  value={draft.seo_description}
                  onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })}
                  className={areaClass}
                />
              </Field>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <Toggle checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} label="Visible on site" />
            <Toggle
              checked={draft.is_featured}
              onChange={(v) => setDraft({ ...draft, is_featured: v })}
              label="Feature on homepage"
            />
          </div>

          <div className="mt-6 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Plans / durations</h3>
              <Btn
                variant="ghost"
                onClick={() => setDraft({ ...draft, variants: [...draft.variants, emptyVariant(draft.variants.length)] })}
              >
                <Plus className="size-4" /> Add plan
              </Btn>
            </div>
            <div className="mt-3 space-y-3">
              {draft.variants.map((v, i) => (
                <div key={i} className="grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-2 lg:grid-cols-6">
                  <Field label="Name">
                    <input value={v.name} onChange={(e) => V(i, { name: e.target.value })} className={inputClass} />
                  </Field>
                  <Field label="Price BDT">
                    <input
                      type="number"
                      value={v.price_bdt}
                      onChange={(e) => V(i, { price_bdt: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Price USD">
                    <input
                      type="number"
                      step="0.01"
                      value={v.price_usd}
                      onChange={(e) => V(i, { price_usd: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Old price BDT">
                    <input
                      type="number"
                      value={v.compare_price_bdt ?? ""}
                      onChange={(e) => V(i, { compare_price_bdt: e.target.value ? Number(e.target.value) : null })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Stock">
                    <input
                      type="number"
                      value={v.stock_qty}
                      onChange={(e) => V(i, { stock_qty: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </Field>
                  <div className="flex flex-col justify-center gap-2">
                    <Toggle
                      checked={v.unlimited_stock}
                      onChange={(val) => V(i, { unlimited_stock: val })}
                      label="Unlimited"
                    />
                    <Toggle checked={v.is_active} onChange={(val) => V(i, { is_active: val })} label="Active" />
                    {draft.variants.length > 1 ? (
                      <button
                        onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, idx) => idx !== i) })}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-destructive"
                      >
                        <Trash2 className="size-3.5" /> Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Btn onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save product"}
            </Btn>
            <Btn variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Btn>
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Products"
        description="Everything you sell — subscriptions, credits and licenses."
        action={
          !draft ? (
            <Btn onClick={() => setDraft(emptyDraft())}>
              <Plus className="size-4" /> Add product
            </Btn>
          ) : null
        }
      >
        {isLoading ? (
          <Empty>Loading products…</Empty>
        ) : data?.products.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Plans</Th>
                <Th>Delivery</Th>
                <Th>Keys in stock</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.products.map((p: any) => {
                const vs = data.variants.filter((v: any) => v.product_id === p.id);
                return (
                  <tr key={p.id}>
                    <Td className="font-semibold">
                      {p.title}
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">/{p.slug}</span>
                    </Td>
                    <Td className="text-muted-foreground">
                      {vs.length
                        ? vs.map((v: any) => `${v.name} · ${formatMoney(Number(v.price_bdt), "BDT")}`).join(", ")
                        : "No plans"}
                    </Td>
                    <Td className="capitalize">{p.delivery_mode}</Td>
                    <Td>{p.delivery_mode === "auto" ? (data.keyCounts[p.id] ?? 0) : "—"}</Td>
                    <Td>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          p.is_active ? "border-success/40 bg-success/10 text-success" : "border-border text-muted-foreground"
                        }`}
                      >
                        {p.is_active ? "Live" : "Hidden"}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Btn variant="ghost" onClick={() => edit(p)}>
                          Edit
                        </Btn>
                        <Btn variant="danger" onClick={() => remove(p.id, p.title)}>
                          <Trash2 className="size-4" />
                        </Btn>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <Empty>No products yet. Add your first one.</Empty>
        )}
      </Panel>

      <Panel title="Categories" description="Group products so customers and Google can find them.">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Name">
            <input
              value={cat.name}
              onChange={(e) =>
                setCat({
                  ...cat,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Slug">
            <input value={cat.slug} onChange={(e) => setCat({ ...cat, slug: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Description">
            <input
              value={cat.description}
              onChange={(e) => setCat({ ...cat, description: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="flex items-end">
            <Btn
              onClick={async () => {
                try {
                  await catFn({ data: { ...cat, sort_order: Number(cat.sort_order) } });
                  toast.success("Category saved.");
                  setCat({ slug: "", name: "", description: "", sort_order: 0, is_active: true });
                  await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not save.");
                }
              }}
            >
              Add category
            </Btn>
          </div>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {(data?.categories ?? []).map((c: any) => (
            <li key={c.id} className="rounded-full border border-border px-3 py-1 text-sm">
              {c.name} <span className="text-muted-foreground">/{c.slug}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
