import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteRow, adminListMisc, adminSaveReview } from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";
import { Btn, Empty, Field, Panel, Toggle, areaClass, inputClass } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: Reviews,
});

const empty = {
  id: null as string | null,
  product_id: null as string | null,
  author_name: "",
  rating: 5,
  body: "",
  is_approved: true,
};

function Reviews() {
  const listFn = useServerFn(adminListMisc);
  const saveFn = useServerFn(adminSaveReview);
  const delFn = useServerFn(adminDeleteRow);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);

  const { data, isLoading } = useQuery({ queryKey: ["admin-misc"], queryFn: () => listFn({}) });

  return (
    <>
      <Panel title={form.id ? "Edit review" : "Add a review"} description="Approve customer reviews or add the ones you received on Facebook.">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Customer name">
            <input
              value={form.author_name}
              onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Rating">
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              className={inputClass}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Product (optional)">
            <select
              value={form.product_id ?? ""}
              onChange={(e) => setForm({ ...form, product_id: e.target.value || null })}
              className={inputClass}
            >
              <option value="">General store review</option>
              {(data?.products ?? []).map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-3">
            <Field label="Review text">
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={areaClass} />
            </Field>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Toggle checked={form.is_approved} onChange={(v) => setForm({ ...form, is_approved: v })} label="Show on site" />
          <Btn
            onClick={async () => {
              try {
                await saveFn({ data: form });
                toast.success("Review saved.");
                setForm(empty);
                await queryClient.invalidateQueries({ queryKey: ["admin-misc"] });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not save.");
              }
            }}
          >
            {form.id ? "Update review" : "Add review"}
          </Btn>
          {form.id ? (
            <Btn variant="ghost" onClick={() => setForm(empty)}>
              Cancel
            </Btn>
          ) : null}
        </div>
      </Panel>

      <Panel title="Reviews">
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : data?.reviews.length ? (
          <div className="space-y-3">
            {data.reviews.map((r: any) => (
              <div key={r.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.author_name}</p>
                    <p className="flex items-center gap-0.5 text-xs text-warning">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-current" />
                      ))}
                      <span className="ml-2 text-muted-foreground">{formatDate(r.created_at)}</span>
                      {!r.is_approved ? <span className="ml-2 text-muted-foreground">· pending</span> : null}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {!r.is_approved ? (
                      <Btn
                        onClick={async () => {
                          await saveFn({
                            data: {
                              id: r.id,
                              product_id: r.product_id,
                              author_name: r.author_name,
                              rating: r.rating,
                              body: r.body ?? "",
                              is_approved: true,
                            },
                          });
                          toast.success("Approved.");
                          await queryClient.invalidateQueries({ queryKey: ["admin-misc"] });
                        }}
                      >
                        Approve
                      </Btn>
                    ) : null}
                    <Btn
                      variant="ghost"
                      onClick={() =>
                        setForm({
                          id: r.id,
                          product_id: r.product_id,
                          author_name: r.author_name,
                          rating: r.rating,
                          body: r.body ?? "",
                          is_approved: r.is_approved,
                        })
                      }
                    >
                      Edit
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={async () => {
                        await delFn({ data: { table: "reviews", id: r.id } });
                        toast.success("Deleted.");
                        await queryClient.invalidateQueries({ queryKey: ["admin-misc"] });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Btn>
                  </div>
                </div>
                {r.body ? <p className="mt-2 text-sm text-muted-foreground">{r.body}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <Empty>No reviews yet.</Empty>
        )}
      </Panel>
    </>
  );
}
