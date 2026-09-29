import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Pixel Line" },
      {
        name: "description",
        content: "The terms that apply when you buy AI subscriptions, credits or tool licenses from Pixel Line.",
      },
      { property: "og:title", content: "Terms & Conditions — Pixel Line" },
      { property: "og:description", content: "Order, payment, delivery and usage terms for Pixel Line customers." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Terms,
});

const sections = [
  {
    title: "1. Orders and payment",
    body: "All prices are shown in BDT and USD. Payments are manual: you send the amount to the account shown at checkout and submit the transaction ID. An order is only confirmed after our team verifies that payment.",
  },
  {
    title: "2. Delivery",
    body: "Delivery time is shown on each product page. Instant products are delivered right after verification; manual products are delivered by our team, usually within 10-30 minutes during support hours.",
  },
  {
    title: "3. Your responsibilities",
    body: "You must give correct account details for activation. Do not change the account password or email during an active subscription period unless we ask you to. Sharing a delivered license with others may void it.",
  },
  {
    title: "4. Fraud and abuse",
    body: "Fake payment proofs, chargeback attempts or abusive behaviour lead to an immediate block and cancellation without refund.",
  },
  {
    title: "5. Limitation of liability",
    body: "Pixel Line is a reseller. We are not responsible for changes a platform makes to its own pricing, features or policies after your purchase.",
  },
  {
    title: "6. Changes",
    body: "We may update these terms at any time. The version shown on this page at the time of your order applies to that order.",
  },
];

function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Terms & conditions</h1>
      <div className="mt-6 space-y-5">
        {sections.map((s) => (
          <section key={s.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-base font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
