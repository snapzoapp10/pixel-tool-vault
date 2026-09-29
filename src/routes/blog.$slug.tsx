import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getBlogPost } from "@/lib/public.functions";
import { formatDate } from "@/lib/format";

const postQuery = (slug: string) =>
  queryOptions({ queryKey: ["blog", slug], queryFn: () => getBlogPost({ data: { slug } }) });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Article not found — Pixel Line" }, { name: "robots", content: "noindex" }] };
    }
    const title = loaderData.seo_title || `${loaderData.title} — Pixel Line`;
    const description = loaderData.seo_description || loaderData.excerpt || loaderData.title;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/blog/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: loaderData.title,
            datePublished: loaderData.published_at,
            author: { "@type": "Organization", name: "Pixel Line" },
          }),
        },
      ],
    };
  },
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/blog" className="text-sm font-semibold text-primary hover:underline">
        ← All guides
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">{post!.title}</h1>
      <p className="mt-2 text-xs text-muted-foreground">{formatDate(post!.published_at)}</p>
      {post!.cover_url ? (
        <img src={post!.cover_url} alt={post!.title} className="mt-6 w-full rounded-xl object-cover" />
      ) : null}
      <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-foreground">{post!.content}</div>
    </article>
  );
}
