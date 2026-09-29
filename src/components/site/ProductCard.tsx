import { Link } from "@tanstack/react-router";
import { Clock, ShieldCheck, Zap } from "lucide-react";
import { Price } from "./Price";
import type { ProductCardData } from "@/lib/public.functions";

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-lg font-semibold text-muted-foreground">
              {product.brand ?? product.title.slice(0, 18)}
            </span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {product.delivery_mode === "auto" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
              <Zap className="size-3" /> Instant
            </span>
          ) : null}
          {!product.in_stock ? (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
              Out of stock
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          {product.category_name ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{product.category_name}</p>
          ) : null}
          <h3 className="font-display text-base font-semibold leading-snug">{product.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
        </div>

        <div className="mt-auto space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <Price bdt={product.from_bdt} usd={product.from_usd} compareBdt={product.compare_bdt} />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {product.delivery_time_text}
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5" /> Verified seller
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
