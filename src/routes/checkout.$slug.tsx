import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { createOrder, getCheckoutData, validateCoupon } from "@/lib/public.functions";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";

const checkoutQuery = (slug: string) =>
  queryOptions({ queryKey: ["checkout", slug], queryFn: () => getCheckoutData({ data: { slug } }) });

export const Route = createFileRoute("/checkout/$slug")({
  validateSearch: (s: Record<string, unknown>) => ({
    variant: typeof s["variant"] === "string" ? s["variant"] : undefined,
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(checkoutQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Checkout — ${loaderData?.product.title ?? "Pixel Line"}` },
      {
        name: "description",
        content: "Complete your Pixel Line order: choose a plan, pay with bKash, Nagad, Rocket, Binance or Bybit.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Checkout — Pixel Line" },
      { property: "og:description", content: "Secure manual payment checkout for Pixel Line orders." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(checkoutQuery(slug));
  const { currency } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const submitOrder = useServerFn(createOrder);
  const checkCoupon = useServerFn(validateCoupon);

  const variants = data!.variants;
  const methods = data!.methods;
  const [variantId, setVariantId] = useState(search.variant ?? variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState(methods[0]?.key ?? "");
  const [form, setForm] = useState({
    name: "",
    email: user?.email ?? "",
    phone: "",
    note: "",
    txnId: "",
    senderAccount: "",
    coupon: "",
  });
  const [discount, setDiscount] = useState(0);
  const [proof, setProof] = useState<{ name: string; type: string; base64: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const unit = variant ? (currency === "BDT" ? variant.price_bdt : variant.price_usd) : 0;
  const subtotal = unit * quantity;
  const total = Math.max(0, subtotal - discount);
  const selectedMethod = methods.find((m) => m.key === method);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onFile(file: File | undefined) {
    if (!file) return setProof(null);
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Screenshot must be smaller than 2 MB.");
      return;
    }
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
    setProof({ name: file.name, type: file.type, base64: btoa(binary) });
  }

  async function applyCoupon() {
    if (!form.coupon.trim()) return;
    try {
      const res = await checkCoupon({ data: { code: form.coupon, subtotal } });
      if (!res.ok) {
        setDiscount(0);
        toast.error(res.message);
        return;
      }
      setDiscount(res.discount);
      toast.success(`Coupon applied — you save ${formatMoney(res.discount, currency)}`);
    } catch {
      toast.error("Could not check that coupon.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!variant) return;
    setBusy(true);
    try {
      const res = await submitOrder({
        data: {
          slug,
          variantId: variant.id,
          quantity,
          currency,
          name: form.name,
          email: form.email,
          phone: form.phone,
          note: form.note,
          couponCode: form.coupon,
          methodKey: method,
          txnId: form.txnId,
          senderAccount: form.senderAccount,
          userId: user?.id ?? null,
          proof,
        },
      });
      toast.success("Order received! We are verifying your payment.");
      navigate({ to: "/track", search: { order: res.orderNumber, email: res.email } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place the order.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pay using any method below, then submit your transaction details. We verify and deliver.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {/* Plan */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">1. Your plan</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
              <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className={inputClass}>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {data!.product.title} — {v.name} (
                    {formatMoney(currency === "BDT" ? v.price_bdt : v.price_usd, currency)})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={20}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className={inputClass}
                aria-label="Quantity"
              />
            </div>
          </section>

          {/* Customer */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">2. Your details</h2>
            {!user ? (
              <p className="mt-1 text-xs text-muted-foreground">
                No account needed. Create one later to see all your orders in one place.
              </p>
            ) : null}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
              />
              <input
                required
                type="email"
                placeholder="Email (delivery goes here)"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="WhatsApp / phone number"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Account email for activation (optional)"
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                className={inputClass}
              />
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">3. Pay {formatMoney(total, currency)}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {methods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-semibold ${
                    method === m.key ? "border-primary bg-primary/5 text-primary" : "border-border"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {selectedMethod ? (
              <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Send exactly {formatMoney(total, currency)} to
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm font-semibold">
                    {selectedMethod.account_value || "Ask support for the account"}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedMethod.account_value ?? "");
                      toast.success("Copied");
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <Copy className="size-3.5" /> Copy
                  </button>
                  {selectedMethod.network ? (
                    <span className="text-xs text-muted-foreground">({selectedMethod.network})</span>
                  ) : null}
                </div>
                {selectedMethod.instructions ? (
                  <p className="mt-2 text-sm text-muted-foreground">{selectedMethod.instructions}</p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Transaction ID / TxID"
                value={form.txnId}
                onChange={(e) => set("txnId", e.target.value)}
                className={inputClass}
              />
              <input
                placeholder="Your sending number / wallet"
                value={form.senderAccount}
                onChange={(e) => set("senderAccount", e.target.value)}
                className={inputClass}
              />
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-3 text-sm">
              <Upload className="size-4 text-primary" />
              <span className="flex-1">
                {proof ? proof.name : "Attach payment screenshot (optional, max 2 MB)"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
          </section>
        </div>

        {/* Summary */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{data!.product.title}</dt>
                <dd className="font-medium">{variant?.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Quantity</dt>
                <dd className="font-medium">{quantity}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatMoney(subtotal, currency)}</dd>
              </div>
              {discount ? (
                <div className="flex justify-between gap-3 text-success">
                  <dt>Coupon discount</dt>
                  <dd>-{formatMoney(discount, currency)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 border-t border-border pt-2 font-display text-lg font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(total, currency)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-2">
              <input
                placeholder="Coupon code"
                value={form.coupon}
                onChange={(e) => set("coupon", e.target.value.toUpperCase())}
                className={inputClass}
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="shrink-0 rounded-lg border border-border px-3 text-sm font-semibold"
              >
                Apply
              </button>
            </div>

            <button
              type="submit"
              disabled={busy || !variant}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Place order
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Delivery: {data!.product.delivery_time_text} after payment verification. You will get an order number
              to track everything.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
