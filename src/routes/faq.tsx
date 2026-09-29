import { createFileRoute } from "@tanstack/react-router";

const faqs = [
  {
    q: "Are these products genuine?",
    a: "Yes. We only sell real subscriptions, official credit top-ups and genuine license keys. We never use cracked software or stolen accounts.",
  },
  {
    q: "How do I pay?",
    a: "Pay with bKash, Nagad or Rocket if you are in Bangladesh, or with Binance Pay / Bybit (USDT) from anywhere. At checkout you send the payment, then submit your transaction ID.",
  },
  {
    q: "How long does delivery take?",
    a: "Instant-delivery products are handed over as soon as your payment is verified. Manual products usually take 10-30 minutes during support hours.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can order as a guest with just your name and email. Creating an account lets you see all your past orders and deliveries in one place.",
  },
  {
    q: "Can I get a refund?",
    a: "If we cannot deliver your product or it does not work as described, you get a full refund. See our refund policy for details.",
  },
  {
    q: "Is my account information safe?",
    a: "We only ask for what is strictly needed for activation, and we never share your details with anyone else.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Payment, Delivery & Refunds | Pixel Line" },
      {
        name: "description",
        content:
          "Answers about Pixel Line payment methods, delivery time, guest checkout, product authenticity and refunds.",
      },
      { property: "og:title", content: "Frequently asked questions — Pixel Line" },
      { property: "og:description", content: "Payment, delivery, authenticity and refund questions answered." },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
  }),
  component: Faq,
});

function Faq() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Frequently asked questions</h1>
      <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-card shadow-card">
        {faqs.map((f) => (
          <details key={f.q} className="group p-5">
            <summary className="cursor-pointer font-display text-base font-semibold marker:content-none">
              {f.q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
