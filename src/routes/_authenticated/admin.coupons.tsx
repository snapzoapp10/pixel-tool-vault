import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteRow, adminListMisc, adminSaveCoupon } from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";
import { Btn, Empty, Field, Panel, Td, TableWrap, Th, Toggle, inputClass } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: Coupons,
});

const empty = {
  id: null as string | null,
  code: "",
  discount_type: "percent" as "percent" | "fixed",
  value: 10,
  max_uses: null as number | null,
  expires_at: "",
  is_active: true,
};

function Coupons() {
  const listFn = useServerFn(adminListMisc);
  const saveFn = useServerFn(adminSaveCoupon);
  const delFn = useServerFn(adminDeleteRow);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);

  const { data, isLoading } = useQuery({ queryKey: ["admin-misc"], queryFn: () => listFn({}) });

  return (
    <>
      <Panel title={form.id ? "Edit coupon" : "Create a coupon"} description="Percent or fixed discount, with optional usage limit and expiry.">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Code">
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className={inputClass}
            />
          </Field>
          <Field label="Type">
            <select
              value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })}
              className={inputClass}
            >
              <option value="percent">Percent %</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </Field>
          <Field label="Value">
            <input
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Max uses" hint="Leave empty for unlimited">
            <input
              type="number"
              value={form.max_uses ?? ""}
              onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            />
          </Field>
          <Field label="Expires">
            <input
              type="date"
              value={form.expires_at ? form.expires_at.slice(0, 10) : ""}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Active" />
          <Btn
            onClick={async () => {
              try {
                await saveFn({
                  data: {
                    ...form,
                    value: Number(form.value),
                    expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
                  },
                });
                toast.success("Coupon saved.");
                setForm(empty);
                await queryClient.invalidateQueries({ queryKey: ["admin-misc"] });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not save the coupon.");
              }
            }}
          >
            {form.id ? "Update coupon" : "Create coupon"}
          </Btn>
          {form.id ? (
            <Btn variant="ghost" onClick={() => setForm(empty)}>
              Cancel
            </Btn>
          ) : null}
        </div>
      </Panel>

      <Panel title="Coupons">
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : data?.coupons.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Discount</Th>
                <Th>Used</Th>
                <Th>Expires</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.coupons.map((c: any) => (
                <tr key={c.id}>
                  <Td className="font-mono font-semibold">{c.code}</Td>
                  <Td>{c.discount_type === "percent" ? `${c.value}%` : `৳${c.value}`}</Td>
                  <Td>
                    {c.used_count}
                    {c.max_uses ? ` / ${c.max_uses}` : ""}
                  </Td>
                  <Td className="text-muted-foreground">{c.expires_at ? formatDate(c.expires_at) : "Never"}</Td>
                  <Td>{c.is_active ? "Active" : "Off"}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Btn
                        variant="ghost"
                        onClick={() =>
                          setForm({
                            id: c.id,
                            code: c.code,
                            discount_type: c.discount_type,
                            value: Number(c.value),
                            max_uses: c.max_uses,
                            expires_at: c.expires_at ?? "",
                            is_active: c.is_active,
                          })
                        }
                      >
                        Edit
                      </Btn>
                      <Btn
                        variant="danger"
                        onClick={async () => {
                          await delFn({ data: { table: "coupons", id: c.id } });
                          toast.success("Coupon deleted.");
                          await queryClient.invalidateQueries({ queryKey: ["admin-misc"] });
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <Empty>No coupons yet.</Empty>
        )}
      </Panel>
    </>
  );
}
