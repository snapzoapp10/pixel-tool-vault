import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Globe2, HeartHandshake, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Pixel Line — Trusted AI Reseller in Bangladesh" },
      {
        name: "description",
        content:
          "Pixel Line is a Bangladesh-based reseller of genuine AI subscriptions, credits and tool licenses, serving freelancers, students and agencies.",
      },
      { property: "og:title", content: "About Pixel Line" },
      { property: "og:description", content: "Who we are and why thousands trust Pixel Line for AI products." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

const values = [
  { icon: BadgeCheck, title: "Only genuine products", text: "We never sell cracked software or stolen accounts." },
  { icon: HeartHandshake, title: "Support that answers", text: "A real person replies during support hours, every day." },
  { icon: Users, title: "Built for our community", text: "Fair prices for students, freelancers and small agencies." },
  { icon: Globe2, title: "Local & global payment", text: "Mobile banking for Bangladesh, crypto for everyone else." },
];

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">About Pixel Line</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Pixel Line started on Facebook as a small page helping people in Bangladesh get access to the AI tools they
        needed for work and study. Paying for international subscriptions is hard here — cards get declined, prices
        are unclear and scams are everywhere. We built Pixel Line to fix that.
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Today we resell AI subscriptions, API credits and premium tool licenses to creators, freelancers, students and
        agencies. Every order is checked by a human, every payment is verified, and every delivery comes with proof.
        If something does not work, we fix it or refund it.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {values.map((v) => (
          <div key={v.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <v.icon className="size-5 text-primary" />
            <h2 className="mt-3 font-display text-base font-semibold">{v.title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="ink-panel mt-10 rounded-2xl p-7">
        <h2 className="font-display text-xl font-bold">Ready to get started?</h2>
        <p className="mt-2 text-sm text-ink-muted">Browse our catalogue or message us with what you need.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/shop" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Browse products
          </Link>
          <Link to="/contact" className="rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
