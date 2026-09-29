import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Pixel Line" },
      {
        name: "description",
        content: "When Pixel Line issues refunds for AI subscriptions, credits and tool licenses, and how to request one.",
      },
      { property: "og:title", content: "Refund Policy — Pixel Line" },
      { property: "og:description", content: "Clear refund rules for digital AI products bought from Pixel Line." },
      { property: "og:url", content: "/refund" },
    ],
    links: [{ rel: "canonical", href: "/refund" }],
  }),
  component: Refund,
});

function Refund() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Refund policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We sell digital products, so refunds follow clear rules. Here is exactly when you get your money back.
      </p>

      <div className="mt-6 space-y-5">
        <section className="rounded-xl border border-success/40 bg-success/5 p-5">
          <h2 className="font-display text-base font-semibold">You get a full refund when</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>We cannot deliver your product within the stated delivery time.</li>
            <li>The delivered key, credit or activation does not work and we cannot replace it.</li>
            <li>You were charged twice for the same order.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-semibold">No refund is possible when</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>The product was delivered and used successfully.</li>
            <li>The account lost access because its password or email was changed without telling us.</li>
            <li>You simply changed your mind after delivery of a working digital product.</li>
            <li>The platform itself banned your account for breaking its own rules.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-base font-semibold">How to request a refund</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Message us with your order number and what went wrong. Refunds are sent back through the same payment
            method within 1-3 working days after approval.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/track" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">
              Find my order
            </Link>
            <Link to="/contact" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Contact support
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
