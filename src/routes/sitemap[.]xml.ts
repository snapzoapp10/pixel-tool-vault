import { createFileRoute } from "@tanstack/react-router";

const staticPaths = ["/", "/shop", "/about", "/contact", "/faq", "/terms", "/refund", "/blog", "/track"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const { publicDb } = await import("@/lib/sb.server");
        const db = publicDb();
        const [products, categories, posts] = await Promise.all([
          db.from("products").select("slug, updated_at"),
          db.from("categories").select("slug"),
          db.from("blog_posts").select("slug, published_at"),
        ]);

        const urls: { loc: string; lastmod?: string; priority: string }[] = [
          ...staticPaths.map((p) => ({ loc: `${origin}${p}`, priority: p === "/" ? "1.0" : "0.7" })),
          ...(categories.data ?? []).map((c) => ({
            loc: `${origin}/shop?category=${c.slug}`,
            priority: "0.8",
          })),
          ...(products.data ?? []).map((p) => ({
            loc: `${origin}/product/${p.slug}`,
            lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
            priority: "0.9",
          })),
          ...(posts.data ?? []).map((p) => ({
            loc: `${origin}/blog/${p.slug}`,
            lastmod: p.published_at ? new Date(p.published_at).toISOString() : undefined,
            priority: "0.6",
          })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc.replace(/&/g, "&amp;")}</loc>${
        u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""
      }<priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
