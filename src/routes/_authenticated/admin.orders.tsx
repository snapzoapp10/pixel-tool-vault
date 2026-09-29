import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { adminListOrders, adminProofUrl, adminUpdateOrder } from "@/lib/admin.functions";
import { formatDate, formatMoney, statusTone } from "@/lib/format";
import { Btn, Empty, Field, Panel, Td, TableWrap, Th, areaClass, inputClass } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: Orders,
});

const statuses = ["all", "pending", "verified", "delivered", "rejected", "cancelled"];

function Orders() {
  const listFn = useServerFn(adminListOrders);
  const updateFn = useServerFn(adminUpdateOrder);
  const proofFn = useServerFn(adminProofUrl);
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, { note: string; delivery: string; reason: string }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", status, q],
    queryFn: () => listFn({ data: { status, q } }),
  });

  function draftFor(o: any) {
    return (
      draft[o.id] ?? {
        note: o.admin_note ?? "",
        delivery: o.delivered_content ?? "",
        reason: o.reject_reason ?? "",
      }
    );
  }

  async function update(o: any, next?: string) {
    const d = draftFor(o);
    try {
      const res = await updateFn({
        data: {
          id: o.id,
          ...(next ? { status: next as any } : {}),
          admin_note: d.note,
          delivered_content: d.delivery,
          reject_reason: d.reason,
        },
      });
      toast.success(`Order ${o.order_number} → ${res.status}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    }
  }

  async function viewProof(path: string) {
    try {
      const { url } = await proofFn({ data: { path } });
      if (url) window.open(url, "_blank", "noopener");
      else toast.error("Proof file not found.");
    } catch {
      toast.error("Could not open the payment proof.");
    }
  }

  return (
    <Panel title="Orders & payment verification" description="Check the payment proof, then verify, deliver or reject.">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize ${
                status === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order no, email, txn id"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <Empty>Loading orders…</Empty>
        ) : data?.orders.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Payment</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o: any) => {
                const d = draftFor(o);
                return (
                  <>
                    <tr key={o.id}>
                      <Td className="font-semibold">
                        {o.order_number}
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {formatDate(o.created_at)}
                        </span>
                      </Td>
                      <Td>
                        {o.customer_name}
                        <span className="mt-0.5 block text-xs text-muted-foreground">{o.customer_email}</span>
                        {o.customer_phone ? (
                          <span className="block text-xs text-muted-foreground">{o.customer_phone}</span>
                        ) : null}
                      </Td>
                      <Td>
                        {o.payment_method_name}
                        <span className="mt-0.5 block text-xs text-muted-foreground">TXN: {o.txn_id || "—"}</span>
                        {o.sender_account ? (
                          <span className="block text-xs text-muted-foreground">From: {o.sender_account}</span>
                        ) : null}
                      </Td>
                      <Td className="font-semibold">{formatMoney(Number(o.total), o.currency)}</Td>
                      <Td>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusTone[o.status]}`}
                        >
                          {o.status}
                        </span>
                      </Td>
                      <Td>
                        <Btn variant="ghost" onClick={() => setOpen(open === o.id ? null : o.id)}>
                          {open === o.id ? "Close" : "Manage"}
                        </Btn>
                      </Td>
                    </tr>
                    {open === o.id ? (
                      <tr key={`${o.id}-detail`}>
                        <Td className="pb-6" >
                          <div className="w-[min(88vw,900px)] space-y-4">
                            <div className="rounded-lg border border-border bg-muted/40 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Items
                              </p>
                              <ul className="mt-2 space-y-1 text-sm">
                                {o.items.map((i: any) => (
                                  <li key={i.id} className="flex justify-between gap-3">
                                    <span>
                                      {i.product_title} · {i.variant_name} × {i.quantity}
                                    </span>
                                    <span>{formatMoney(Number(i.line_total), o.currency)}</span>
                                  </li>
                                ))}
                              </ul>
                              {o.coupon_code ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Coupon {o.coupon_code} · −{formatMoney(Number(o.discount), o.currency)}
                                </p>
                              ) : null}
                              {o.customer_note ? (
                                <p className="mt-2 text-sm">
                                  <span className="font-semibold">Customer note: </span>
                                  {o.customer_note}
                                </p>
                              ) : null}
                              {o.proof_path ? (
                                <Btn variant="ghost" className="mt-3" onClick={() => viewProof(o.proof_path)}>
                                  <Eye className="size-4" /> View payment proof
                                </Btn>
                              ) : (
                                <p className="mt-3 text-xs text-muted-foreground">No screenshot uploaded.</p>
                              )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <Field label="Delivered content" hint="Keys, logins or instructions the customer will see.">
                                <textarea
                                  value={d.delivery}
                                  onChange={(e) =>
                                    setDraft((p) => ({ ...p, [o.id]: { ...d, delivery: e.target.value } }))
                                  }
                                  className={areaClass}
                                />
                              </Field>
                              <div className="space-y-3">
                                <Field label="Internal note">
                                  <input
                                    value={d.note}
                                    onChange={(e) => setDraft((p) => ({ ...p, [o.id]: { ...d, note: e.target.value } }))}
                                    className={inputClass}
                                  />
                                </Field>
                                <Field label="Reject reason (shown to customer)">
                                  <input
                                    value={d.reason}
                                    onChange={(e) =>
                                      setDraft((p) => ({ ...p, [o.id]: { ...d, reason: e.target.value } }))
                                    }
                                    className={inputClass}
                                  />
                                </Field>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Btn onClick={() => update(o, "verified")}>Verify payment</Btn>
                              <Btn onClick={() => update(o, "delivered")}>Mark delivered</Btn>
                              <Btn variant="ghost" onClick={() => update(o)}>
                                Save only
                              </Btn>
                              <Btn variant="danger" onClick={() => update(o, "rejected")}>
                                Reject
                              </Btn>
                              <Btn variant="danger" onClick={() => update(o, "cancelled")}>
                                Cancel
                              </Btn>
                            </div>
                          </div>
                        </Td>
                      </tr>
                    ) : null}
                  </>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <Empty>No orders match this filter.</Empty>
        )}
      </div>
    </Panel>
  );
}
