import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteRow, adminListMisc, adminSavePaymentMethod } from "@/lib/admin.functions";
import { Btn, Empty, Field, Panel, Toggle, areaClass, inputClass } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: Payments,
});

const empty = {
  id: null as string | null,
  key: "",
  name: "",
  kind: "mobile" as "mobile" | "crypto",
  account_value: "",
  network: "",
  instructions: "",
  is_active: true,
  sort_order: 0,
};

function Payments() {
  const listFn = useServerFn(adminListMisc);
  const saveFn = useServerFn(adminSavePaymentMethod);
  const delFn = useServerFn(adminDeleteRow);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);

  const { data, isLoading } = useQuery({ queryKey: ["admin-misc"], queryFn: () => listFn({}) });

  return (
    <>
      <Panel
        title={form.id ? `Edit ${form.name}` : "Add a payment method"}
        description="Put your real bKash / Nagad / Rocket numbers and crypto addresses here — customers see them at checkout."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Display name">
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                  key: form.id ? form.key : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Internal key">
            <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Type">
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as "mobile" | "crypto" })}
              className={inputClass}
            >
              <option value="mobile">Mobile banking</option>
              <option value="crypto">Crypto / exchange</option>
            </select>
          </Field>
          <Field label="Account number / wallet address">
            <input
              value={form.account_value}
              onChange={(e) => setForm({ ...form, account_value: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Network / extra label" hint="For crypto, e.g. TRC20 or Binance Pay ID">
            <input
              value={form.network}
              onChange={(e) => setForm({ ...form, network: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Instructions shown to the customer">
              <textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                className={areaClass}
              />
            </Field>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Show at checkout" />
          <Btn
            onClick={async () => {
              try {
                await saveFn({ data: form });
                toast.success("Payment method saved.");
                setForm(empty);
                await queryClient.invalidateQueries({ queryKey: ["admin-misc"] });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not save.");
              }
            }}
          >
            {form.id ? "Update method" : "Add method"}
          </Btn>
          {form.id ? (
            <Btn variant="ghost" onClick={() => setForm(empty)}>
              Cancel
            </Btn>
          ) : null}
        </div>
      </Panel>

      <Panel title="Payment methods">
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : data?.methods.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.methods.map((m: any) => (
              <div key={m.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-semibold">{m.name}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {m.kind} {m.network ? `· ${m.network}` : ""} {m.is_active ? "" : "· hidden"}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Btn
                      variant="ghost"
                      onClick={() =>
                        setForm({
                          id: m.id,
                          key: m.key,
                          name: m.name,
                          kind: m.kind,
                          account_value: m.account_value ?? "",
                          network: m.network ?? "",
                          instructions: m.instructions ?? "",
                          is_active: m.is_active,
                          sort_order: m.sort_order,
                        })
                      }
                    >
                      Edit
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={async () => {
                        await delFn({ data: { table: "payment_methods", id: m.id } });
                        toast.success("Removed.");
                        await queryClient.invalidateQueries({ queryKey: ["admin-misc"] });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Btn>
                  </div>
                </div>
                <p className="mt-2 break-all font-mono text-sm">{m.account_value || "No account set"}</p>
                {m.instructions ? <p className="mt-1 text-xs text-muted-foreground">{m.instructions}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <Empty>No payment methods yet.</Empty>
        )}
      </Panel>
    </>
  );
}
