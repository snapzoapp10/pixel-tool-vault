import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, Clock3, Headphones, ShieldCheck, Star, Wallet, Zap } from "lucide-react";
import { getProduct } from "@/lib/public.functions";
import { Price } from "@/components/site/Price";
import { ProductCard } from "@/components/site/ProductCard";

const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProduct({ data: { slug } }) });

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — Pixel Line" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.product;
    const title = p.seo_title || `${p.title} — Buy at Pixel Line`;
    const description =
      p.seo_description || p.short_description || `Buy ${p.title} from Pixel Line with fast verified delivery.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.title,
            description,
            brand: p.brand ?? "Pixel Line",
            offers: loaderData.variants.map((v) => ({
              "@type": "Offer",
              name: v.name,
              price: v.price_usd,
              priceCurrency: "USD",
              availability:
                v.unlimited_stock || v.stock_qty > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            })),
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(slug));
  const navigate = useNavigate();
  const product = data!.product;
  const variants = data!.variants;
  const [selected, setSelected] = useState(variants[0]?.id ?? "");
  const variant = variants.find((v) => v.id === selected) ?? variants[0];
  const avgRating = data!.reviews.length
    ? data!.reviews.reduce((t: number, r: any) => t + r.rating, 0) / data!.reviews.length
    : 0;

  function buyNow() {
    navigate({ to: "/checkout/$slug", params: { slug }, search: { variant: variant?.id } });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 lg:pb-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          Home
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-primary">
          Shop
        </Link>
        {product.category_slug ? (
          <>
            <span>/</span>
            <Link to="/shop" search={{ category: product.category_slug }} className="hover:text-primary">
              {product.category_name}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="aspect-[16/9] w-full bg-secondary">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-2xl font-bold text-muted-foreground">
                  {product.brand ?? "Pixel Line"}
                </div>
              )}
            </div>
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                {product.delivery_mode === "auto" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                    <Zap className="size-3" /> Instant delivery
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Clock3 className="size-3" /> {product.delivery_time_text}
                </span>
                {avgRating ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                    <Star className="size-3 fill-accent text-accent" /> {avgRating.toFixed(1)} (
                    {data!.reviews.length})
                  </span>
                ) : null}
              </div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{product.title}</h1>
              <p className="text-sm text-muted-foreground">{product.short_description}</p>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">Product details</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.long_description || product.short_description}
            </p>
          </section>

          {product.terms ? (
            <section className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-lg font-semibold">Terms for this product</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.terms}</p>
            </section>
          ) : null}

          {data!.reviews.length ? (
            <section className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h2 className="font-display text-lg font-semibold">Customer reviews</h2>
              <ul className="mt-4 space-y-4">
                {data!.reviews.map((r: any) => (
                  <li key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-1 text-accent">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="mt-2 text-sm">{r.body}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{r.author_name}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Buy box */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Choose your plan</p>
            <div className="mt-3 space-y-2">
              {variants.map((v) => {
                const out = !v.unlimited_stock && v.stock_qty <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={out}
                    onClick={() => setSelected(v.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selected === v.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    } ${out ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{v.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {out ? "Out of stock" : v.unlimited_stock ? "Available" : `${v.stock_qty} in stock`}
                      </span>
                    </span>
                    <Price bdt={v.price_bdt} usd={v.price_usd} compareBdt={v.compare_price_bdt} size="sm" />
                  </button>
                );
              })}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Total payable</p>
              {variant ? (
                <Price bdt={variant.price_bdt} usd={variant.price_usd} size="lg" />
              ) : (
                <p className="text-sm text-muted-foreground">No plan available</p>
              )}
            </div>

            <button
              type="button"
              onClick={buyNow}
              disabled={!variant}
              className="mt-4 hidden w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 lg:block"
            >
              Buy now
            </button>

            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Wallet className="size-3.5 text-primary" /> bKash · Nagad · Rocket · Binance · Bybit
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-3.5 text-primary" /> Payment verified by our team before delivery
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-primary" /> Genuine product or money back
              </li>
              <li className="flex items-center gap-2">
                <Headphones className="size-3.5 text-primary" /> Support: {data!.settings.support_hours}
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {data!.related.length ? (
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">You may also like</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data!.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">{variant?.name ?? "Select a plan"}</p>
            {variant ? <Price bdt={variant.price_bdt} usd={variant.price_usd} size="md" /> : null}
          </div>
          <button
            type="button"
            onClick={buyNow}
            disabled={!variant}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
}
