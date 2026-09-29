import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Headphones,
  Lock,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { getStorefront } from "@/lib/public.functions";
import { ProductCard } from "@/components/site/ProductCard";

const storefrontQuery = queryOptions({
  queryKey: ["storefront"],
  queryFn: () => getStorefront(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({
    meta: [
      { title: "Pixel Line — Buy AI Subscriptions, Credits & Tool Licenses in Bangladesh" },
      {
        name: "description",
        content:
          "Pixel Line sells genuine AI subscriptions, AI credits and premium tool licenses. Pay with bKash, Nagad, Rocket, Binance or Bybit and get fast, verified delivery.",
      },
      { property: "og:title", content: "Pixel Line — AI Subscriptions, Credits & Tool Licenses" },
      {
        property: "og:description",
        content:
          "Genuine AI subscriptions, credits and tool licenses with mobile banking and crypto payment. Verified delivery and real human support.",
      },
      { property: "og:url", content: "/" },
    ],
  }),
  component: Home,
});

const trustPoints = [
  { icon: Clock3, title: "Fast delivery", text: "Most orders are delivered within 10-30 minutes of payment check." },
  { icon: ShieldCheck, title: "Genuine products", text: "Real subscriptions and licenses — no cracked or stolen keys." },
  { icon: Wallet, title: "Local & crypto pay", text: "bKash, Nagad, Rocket, Binance Pay and Bybit all supported." },
  { icon: Headphones, title: "Human support", text: "Message us any time during support hours and get a real reply." },
];

const steps = [
  { title: "Pick your product", text: "Choose the plan, duration or credit pack that fits you." },
  { title: "Pay & submit proof", text: "Send payment to our account and submit the transaction ID." },
  { title: "We verify it", text: "Our team checks the payment — usually within minutes." },
  { title: "Get delivery", text: "Your key, credit or activation lands in your order page and email." },
];

function Home() {
  const { data } = useSuspenseQuery(storefrontQuery);

  return (
    <>
      {/* Hero */}
      <section className="ink-panel relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(60% 60% at 80% 10%, var(--color-primary) 0%, transparent 60%), radial-gradient(50% 50% at 10% 90%, var(--color-accent) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold">
                <Sparkles className="size-3.5 text-accent" /> Trusted AI reseller since day one
              </span>
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
                Premium AI subscriptions, credits & tool licenses — at fair prices.
              </h1>
              <p className="max-w-xl text-base text-ink-muted sm:text-lg">
                {data.settings.tagline}. Pay with bKash, Nagad, Rocket, Binance or Bybit. We verify your payment
                and deliver fast, with proof on every order.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Browse all products <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/track" search={{}}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
                >
                  Track an order
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="size-4 text-accent" /> Verified payments
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="size-4 text-accent" /> Your data stays private
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-4 text-accent" /> {data.settings.support_hours}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
              <h2 className="font-display text-lg font-semibold">Why buyers choose Pixel Line</h2>
              <ul className="mt-4 space-y-4">
                {trustPoints.map((t) => (
                  <li key={t.title} className="flex gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                      <t.icon className="size-4.5 text-accent" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{t.title}</span>
                      <span className="block text-sm text-ink-muted">{t.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Shop by category</h2>
            <p className="mt-1 text-sm text-muted-foreground">Subscriptions, usage credits and lifetime licenses.</p>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-primary hover:underline">
            View everything →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {data.categories.map((c) => (
            <Link
              key={c.slug}
              to="/shop"
              search={{ category: c.slug }}
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <h3 className="font-display text-lg font-semibold">{c.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-4 text-sm font-semibold text-primary">
                {c.count} product{c.count === 1 ? "" : "s"} →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-secondary/50 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Most popular right now</h2>
          <p className="mt-1 text-sm text-muted-foreground">Hand-picked products our customers buy again and again.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data.featured.length ? data.featured : data.latest).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">How ordering works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-3 font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      {data.reviews.length ? (
        <section className="bg-secondary/50 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">What customers say</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.reviews.map((r: any) => (
                <figure key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center gap-1 text-accent">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-sm text-foreground">
                    <MessageSquareQuote className="mb-2 size-4 text-muted-foreground" />
                    {r.body}
                  </blockquote>
                  <figcaption className="mt-3 text-sm font-semibold">{r.author_name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="ink-panel flex flex-col items-start justify-between gap-5 rounded-2xl p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold">Not sure which plan fits you?</h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              Message us — we will recommend the right subscription or credit pack for your work.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Talk to us <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
