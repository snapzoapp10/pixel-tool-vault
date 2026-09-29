import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteRow, adminListMisc, adminSavePost } from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";
import { Btn, Empty, Field, Panel, Toggle, areaClass, inputClass } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: Blog,
});

const empty = {
  id: null as string | null,
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  cover_url: "",
  seo_title: "",
  seo_description: "",
  is_published: true,
};

function Blog() {
  const listFn = useServerFn(adminListMisc);
  const saveFn = useServerFn(adminSavePost);
  const delFn = useServerFn(adminDeleteRow);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);

  const { data, isLoading } = useQuery({ queryKey: ["admin-misc"], queryFn: () => listFn({}) });

  return (
    <>
      <Panel
        title={form.id ? "Edit article" : "Write an article"}
        description="Guides and comparisons help you rank on Google and bring free traffic."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                  slug:
                    form.id || form.slug
                      ? form.slug
                      : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="URL slug">
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Cover image URL">
            <input
              value={form.cover_url}
              onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="SEO title">
            <input
              value={form.seo_title}
              onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Short summary">
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className={areaClass}
            />
          </Field>
          <Field label="SEO description">
            <textarea
              value={form.seo_description}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              className={areaClass}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Article body">
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className={`${areaClass} min-h-[220px]`}
              />
            </Field>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Toggle checked={form.is_published} onChange={(v) => setForm({ ...form, is_published: v })} label="Published" />
          <Btn
            onClick={async () => {
              try {
                await saveFn({ data: form });
                toast.success("Article saved.");
                setForm(empty);
                await queryClient.invalidateQueries({ queryKey: ["admin-misc"] });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not save.");
              }
            }}
          >
            {form.id ? "Update article" : "Publish article"}
          </Btn>
          {form.id ? (
            <Btn variant="ghost" onClick={() => setForm(empty)}>
              Cancel
            </Btn>
          ) : null}
        </div>
      </Panel>

      <Panel title="Articles">
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : data?.posts.length ? (
          <div className="space-y-3">
            {data.posts.map((p: any) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /blog/{p.slug} · {formatDate(p.published_at)} {p.is_published ? "" : "· draft"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Btn
                    variant="ghost"
                    onClick={() =>
                      setForm({
                        id: p.id,
                        slug: p.slug,
                        title: p.title,
                        excerpt: p.excerpt ?? "",
                        content: p.content ?? "",
                        cover_url: p.cover_url ?? "",
                        seo_title: p.seo_title ?? "",
                        seo_description: p.seo_description ?? "",
                        is_published: p.is_published,
                      })
                    }
                  >
                    Edit
                  </Btn>
                  <Btn
                    variant="danger"
                    onClick={async () => {
                      await delFn({ data: { table: "blog_posts", id: p.id } });
                      toast.success("Deleted.");
                      await queryClient.invalidateQueries({ queryKey: ["admin-misc"] });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No articles yet.</Empty>
        )}
      </Panel>
    </>
  );
}
