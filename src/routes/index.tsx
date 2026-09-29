import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Code2, Crown, Headphones, ShieldCheck, ShoppingCart, Sparkles, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/site/Reveal";

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

const features = [
  { icon: Zap, t: "Instant Delivery", d: "Get your credits and licenses quickly after payment." },
  { icon: ShieldCheck, t: "100% Secure", d: "Trusted payments: bKash, Nagad, Rocket, Binance, Bybit." },
  { icon: Code2, t: "Genuine Products", d: "Original AI subscriptions, credits and licenses." },
  { icon: Headphones, t: "24/7 Support", d: "Our team is always ready to help you." },
];

function HeroVisual() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const on = () => setY(window.scrollY);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const r = Math.min(y, 600);
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-lg [perspective:1200px]">
      <div className="absolute inset-0 transition-transform duration-100" style={{ transform: `rotateY(${-14 + r * 0.03}deg) rotateX(${6 + r * 0.02}deg) translateY(${r * -0.15}px)`, transformStyle: "preserve-3d" }}>
        <div className="glass neon-border absolute left-0 top-8 h-3/4 w-3/5 rounded-2xl p-4" style={{ transform: "translateZ(-60px)" }}>
          <div className="mb-3 flex gap-1.5">{[0,1,2].map(i=><span key={i} className="size-2 rounded-full bg-primary/70" />)}</div>
          {["w-3/4","w-1/2","w-2/3","w-2/5","w-3/5","w-1/3"].map((w,i)=><div key={i} className={`mb-2 h-2 rounded bg-primary/${i%2?"30":"50"} ${w}`} />)}
        </div>
        <div className="glass neon-border absolute right-0 top-0 h-2/3 w-3/5 rounded-2xl" style={{ transform: "translateZ(-30px)" }} />
        <div className="glass neon-border float-y absolute left-[18%] top-[22%] w-[68%] rounded-2xl p-6 glow" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-center gap-3">
            <span className="bg-gradient-brand flex size-12 items-center justify-center rounded-xl"><Sparkles className="size-6 text-primary-foreground" /></span>
            <div><p className="font-display text-2xl font-bold">AI Tools</p><p className="text-xs text-muted-foreground">Build something great</p></div>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-primary/40 bg-background/40 p-3">
            <div className="flex items-center gap-2"><Zap className="size-6 text-primary" /><div><p className="text-[11px] text-muted-foreground">Credits</p><p className="font-display text-xl font-bold">100</p></div></div>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">+</span>
          </div>
        </div>
        <div className="glass neon-border absolute right-2 top-2 rounded-xl px-3 py-2 text-xs font-semibold" style={{ transform: "translateZ(80px)" }}>✦ Turn your ideas into products</div>
      </div>
    </div>
  );
}

function Home() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const products = data.featured.length ? data.featured : data.latest;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div className="space-y-6 animate-fade-in">
            <span className="neon-border inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
              <Zap className="size-3.5 text-primary" /> Fast • Secure • Reliable
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Buy AI Credits and <span className="text-primary">Build Faster</span>
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Genuine AI subscriptions, credits & tool licenses — delivered fast. Pay with bKash, Nagad, Rocket, Binance or Bybit.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              {["Instant Delivery", "Secure Payment", "100% Genuine"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" />{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="glow inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-105">
                <ShoppingCart className="size-4" /> Buy Now <ArrowRight className="size-4" />
              </Link>
              <Link to="/track" search={{ order: undefined, email: undefined }} className="neon-border inline-flex items-center rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-105">
                Track Order
              </Link>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="border-b border-border">
        <Reveal>
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.t}>
                <span className="neon-border flex size-14 items-center justify-center rounded-xl"><f.icon className="size-7 text-primary" /></span>
                <h3 className="mt-4 font-display text-lg font-bold">{f.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="text-center">
            <span className="neon-border inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"><Crown className="size-3.5 text-primary" /> Our Plans</span>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Choose Your <span className="text-primary">AI Plan</span></h2>
            <p className="mt-2 text-muted-foreground">Select the perfect plan for your needs.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="tilt"><ProductCard product={p} /></div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {data.categories.map((c) => (
              <Link key={c.slug} to="/shop" search={{ category: c.slug }} className="neon-border rounded-full px-4 py-2 text-sm font-semibold hover:bg-secondary">
                {c.name} ({c.count})
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-t border-border">
        <Reveal>
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 lg:grid-cols-2">
            <div className="space-y-4">
              <span className="neon-border inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"><Star className="size-3.5 text-primary" /> Why Pixel Line?</span>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Your Trusted Partner for <span className="text-primary">AI Tools</span></h2>
              <p className="text-muted-foreground">We make it easy, safe and simple to get your AI credits and licenses — whether you are a solo builder or a growing team.</p>
              <Link to="/shop" className="glow inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Get Started Now <ArrowRight className="size-4" /></Link>
            </div>
            <div className="glass neon-border tilt space-y-3 rounded-3xl p-8">
              {["Build faster", "Save time", "Create amazing things"].map((t) => (
                <p key={t} className="flex items-center gap-3 font-semibold"><CheckCircle2 className="size-5 text-primary" />{t}</p>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
