import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Clock, Copy, Loader2, PackageCheck, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { lookupOrder } from "@/lib/public.functions";
import { formatDate, formatMoney, statusTone } from "@/lib/format";

export const Route = createFileRoute("/track")({
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s["order"] === "string" ? s["order"] : undefined,
    email: typeof s["email"] === "string" ? s["email"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track your order — Pixel Line" },
      {
        name: "description",
        content: "Check your Pixel Line order status, payment verification and delivery details with your order number.",
      },
      { property: "og:title", content: "Track your order — Pixel Line" },
      { property: "og:description", content: "Enter your order number and email to see status and delivery." },
      { property: "og:url", content: "/track" },
    ],
    links: [{ rel: "canonical", href: "/track" }],
  }),
  component: Track,
});

const steps = [
  { key: "pending", label: "Payment submitted", icon: Clock },
  { key: "verified", label: "Payment verified", icon: CheckCircle2 },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

function Track() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/track" });
  const [orderNumber, setOrderNumber] = useState(search.order ?? "");
  const [email, setEmail] = useState(search.email ?? "");

  const enabled = Boolean(search.order && search.email);
  const { data, isFetching } = useQuery({
    queryKey: ["track", search.order, search.email],
    queryFn: () => lookupOrder({ data: { orderNumber: search.order!, email: search.email! } }),
    enabled,
  });

  const inputClass =
    "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary";

  const status = data?.order.status ?? "";
  const activeIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Track your order</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the order number we gave you plus the email you used at checkout.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ search: { order: orderNumber.trim(), email: email.trim() } });
        }}
        className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-5 shadow-card sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          required
          placeholder="Order number (PL-1001)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className={inputClass}
        />
        <input
          required
          type="email"
          placeholder="Email used at checkout"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          {isFetching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Check
        </button>
      </form>

      {enabled && !isFetching && !data ? (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          We could not find that order. Double-check the order number and email, or contact support.
        </p>
      ) : null}

      {data ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-xl font-bold">{data.order.order_number}</p>
                <p className="text-xs text-muted-foreground">Placed {formatDate(data.order.created_at)}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusTone[status] ?? ""}`}
              >
                {status}
              </span>
            </div>

            {status === "rejected" || status === "cancelled" ? (
              <div className="mt-4 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <XCircle className="mt-0.5 size-4 shrink-0" />
                <span>{data.order.reject_reason || "This order was cancelled. Please contact support."}</span>
              </div>
            ) : (
              <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                {steps.map((s, i) => {
                  const done = activeIndex >= i;
                  return (
                    <li
                      key={s.key}
                      className={`rounded-lg border p-3 ${
                        done ? "border-primary/40 bg-primary/5" : "border-border"
                      }`}
                    >
                      <s.icon className={`size-4 ${done ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="mt-1.5 text-sm font-semibold">{s.label}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">Order details</h2>
            <ul className="mt-3 divide-y divide-border text-sm">
              {data.items.map((i: any, idx: number) => (
                <li key={idx} className="flex justify-between gap-3 py-2.5">
                  <span>
                    <span className="block font-medium">{i.product_title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {i.variant_name} × {i.quantity}
                    </span>
                  </span>
                  <span className="font-medium">
                    {formatMoney(Number(i.line_total), data.order.currency as "BDT" | "USD")}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Payment method</dt>
                <dd className="font-medium">{data.order.payment_method_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="font-medium">{data.order.txn_id}</dd>
              </div>
              <div className="flex justify-between font-display text-base font-semibold">
                <dt>Total paid</dt>
                <dd>{formatMoney(Number(data.order.total), data.order.currency as "BDT" | "USD")}</dd>
              </div>
            </dl>
          </div>

          {data.order.delivered_content ? (
            <div className="rounded-xl border border-success/40 bg-success/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">Your delivery</h2>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(data.order.delivered_content ?? "");
                    toast.success("Copied");
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
                >
                  <Copy className="size-3.5" /> Copy
                </button>
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm">
                {data.order.delivered_content}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
