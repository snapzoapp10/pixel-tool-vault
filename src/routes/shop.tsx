import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { listProducts } from "@/lib/public.functions";
import { ProductCard } from "@/components/site/ProductCard";

type ShopSearch = { category?: string | undefined; q?: string | undefined; sort?: string | undefined };

const shopQuery = (search: ShopSearch) =>
  queryOptions({
    queryKey: ["shop", search.category ?? "", search.q ?? "", search.sort ?? ""],
    queryFn: () => listProducts({ data: search }),
  });

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    sort: typeof search["sort"] === "string" ? search["sort"] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(shopQuery(deps)),
  head: () => ({
    meta: [
      { title: "Shop AI Subscriptions, Credits & Licenses — Pixel Line" },
      {
        name: "description",
        content:
          "Browse every Pixel Line product: AI subscriptions, API credit top-ups and genuine tool licenses with BDT and USD pricing.",
      },
      { property: "og:title", content: "Shop — Pixel Line" },
      { property: "og:description", content: "AI subscriptions, credits and tool licenses with fast verified delivery." },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(shopQuery(search));
  const navigate = useNavigate({ from: "/shop" });

  const setSearch = (patch: ShopSearch) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">All products</h1>
        <p className="text-sm text-muted-foreground">
          {data.products.length} product{data.products.length === 1 ? "" : "s"} available. Prices shown in your
          selected currency.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search.q ?? ""}
            onChange={(e) => setSearch({ q: e.target.value || undefined })}
            placeholder="Search ChatGPT, Canva, credits…"
            className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={search.sort ?? ""}
          onChange={(e) => setSearch({ sort: e.target.value || undefined })}
          className="h-11 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
        >
          <option value="">Sort: default</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/shop"
          search={(prev) => ({ ...prev, category: undefined })}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
            !search.category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
          }`}
        >
          All
        </Link>
        {data.categories.map((c) => (
          <Link
            key={c.slug}
            to="/shop"
            search={(prev) => ({ ...prev, category: c.slug })}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              search.category === c.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {data.products.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No products matched your search. Try a different keyword or category.
        </p>
      )}
    </div>
  );
}
