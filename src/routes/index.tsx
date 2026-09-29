import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, Headphones, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";

const Hero3D = lazy(() => import("@/components/site/Hero3D"));
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const trust = [
  { icon: Clock3, t: "10-30 min delivery" },
  { icon: ShieldCheck, t: "100% genuine" },
  { icon: Wallet, t: "bKash · Nagad · Crypto" },
  { icon: Headphones, t: "Real human support" },
];

function Home() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const products = data.featured.length ? data.featured : data.latest;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 lg:left-1/3">
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <Hero3D />
            </Suspense>
          </ClientOnly>
        </div>
        <div className="pointer-events-none relative mx-auto flex min-h-[88vh] max-w-6xl items-center px-4 py-16">
          <div className="pointer-events-auto max-w-xl space-y-6 animate-fade-in">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
              <Sparkles className="size-3.5 text-accent" /> Build faster with the best AI tools
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Power up your <span className="text-gradient">AI workflow</span> in minutes.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Genuine AI subscriptions, credits & tool licenses. Pay with bKash, Nagad, Rocket, Binance or Bybit.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="bg-gradient-brand glow inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-105">
                Shop now <ArrowRight className="size-4" />
              </Link>
              <Link to="/track" search={{ order: undefined, email: undefined }} className="glass inline-flex items-center rounded-xl px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-105">
                Track order
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <h2 className="font-display text-3xl font-bold">Shop by <span className="text-gradient">category</span></h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {data.categories.map((c, i) => (
              <Link key={c.slug} to="/shop" search={{ category: c.slug }} className="glass tilt group relative overflow-hidden rounded-2xl p-6">
                <div className={`absolute -right-10 -top-10 size-32 rounded-full opacity-60 blur-2xl ${["bg-primary", "bg-accent", "bg-gradient-brand"][i % 3]}`} />
                <h3 className="relative font-display text-xl font-bold">{c.name}</h3>
                <p className="relative mt-2 text-sm text-muted-foreground">{c.description}</p>
                <p className="relative mt-5 text-sm font-semibold text-accent">{c.count} products →</p>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <h2 className="font-display text-3xl font-bold">Most <span className="text-gradient">popular</span></h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="tilt">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-3xl p-8 sm:p-12">
            <div className="bg-gradient-brand absolute inset-0 opacity-20" />
            <div className="relative grid gap-4 sm:grid-cols-4">
              {trust.map((x) => (
                <div key={x.t} className="flex items-center gap-3 text-sm font-semibold">
                  <span className="bg-gradient-brand flex size-10 items-center justify-center rounded-xl"><x.icon className="size-5 text-primary-foreground" /></span>
                  {x.t}
                </div>
              ))}
            </div>
            <div className="relative mt-8 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Not sure which plan fits you?</h2>
              <Link to="/contact" className="bg-gradient-brand glow inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-primary-foreground">
                Talk to us <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
