import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listBlogPosts } from "@/lib/public.functions";
import { formatDate } from "@/lib/format";

const postsQuery = queryOptions({ queryKey: ["blog"], queryFn: () => listBlogPosts() });

export const Route = createFileRoute("/blog/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  head: () => ({
    meta: [
      { title: "AI Guides & News — Pixel Line Blog" },
      {
        name: "description",
        content:
          "Guides on buying AI subscriptions in Bangladesh, comparing plans, saving on API credits and using AI tools safely.",
      },
      { property: "og:title", content: "AI Guides & News — Pixel Line" },
      { property: "og:description", content: "Practical guides about AI subscriptions, credits and tool licenses." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { data: posts } = useSuspenseQuery(postsQuery);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Guides & news</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Buying guides, plan comparisons and AI tips — written for Bangladeshi creators and freelancers.
      </p>

      {posts.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {posts.map((p: any) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-colors hover:border-primary/40"
            >
              {p.cover_url ? (
                <img src={p.cover_url} alt={p.title} className="aspect-[16/9] w-full object-cover" loading="lazy" />
              ) : null}
              <div className="p-5">
                <p className="text-xs text-muted-foreground">{formatDate(p.published_at)}</p>
                <h2 className="mt-1.5 font-display text-lg font-semibold">{p.title}</h2>
                <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No articles published yet. Add your first one from the dashboard to start ranking on Google.
        </p>
      )}
    </div>
  );
}
