import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Code2, Crown, Headphones, ShieldCheck, ShoppingCart, Heart, Play, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero-visual.jpg";
import whyImg from "@/assets/why-visual.jpg";
import { Price } from "@/components/site/Price";
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
  { icon: Code2, t: "Official Credits", d: "Original Lovable credits, no risk, no hassle." },
  { icon: Headphones, t: "24/7 Support", d: "Our team is always ready to help you." },
];

function HeroVisual() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const on = () => setY(Math.min(window.scrollY, 700));
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className="[perspective:1200px]">
      <img src={heroImg} alt="AI credits dashboard illustration" width={1200} height={912} fetchPriority="high"
        className="float-y w-full rounded-3xl" style={{ transform: `rotateY(${-6 + y * 0.02}deg) rotateX(${y * 0.03}deg) translateY(${y * -0.12}px)` }} />
    </div>
  );
}

function Home() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const products = (data.featured.length ? data.featured : data.latest).slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-16">
          <div className="space-y-6 animate-fade-in">
            <span className="neon-border inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
              <Zap className="size-3.5 text-primary" /> Fast • Secure • Reliable
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Buy Lovable Credits and <span className="text-primary">Build Faster</span>
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Get Lovable Credits and AI tools instantly and supercharge your AI-powered development. Build, ship, and turn your ideas into real products — faster than ever.
            </p>
            <div className="flex flex-wrap gap-5 text-sm">
              {[[Zap, "Instant Delivery"], [ShieldCheck, "Secure Payment"], [CheckCircle2, "100% Genuine Credits"]].map(([I, t]) => {
                const Icon = I as typeof Zap;
                return <span key={t as string} className="inline-flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-full bg-primary"><Icon className="size-3.5 text-primary-foreground" /></span>{t as string}</span>;
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="glow inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-105">
                <ShoppingCart className="size-4" /> Buy Lovable Credits <ArrowRight className="size-4" />
              </Link>
              <Link to="/faq" className="neon-border inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-105">
                <Play className="size-4 text-primary" /> Learn More
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
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Choose Your <span className="text-primary">Lovable Credits</span> Plan</h2>
            <p className="mt-2 text-muted-foreground">Select the perfect plan for your needs. More credits, more possibilities.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => (
              <div key={p.id} className={`tilt relative flex flex-col rounded-2xl border bg-card p-6 text-center ${i === 0 ? "border-2 border-primary glow" : "border-primary/25"}`}>
                {i === 0 ? <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"><Star className="size-3" /> Most Popular</span> : null}
                <span className="neon-border mx-auto flex size-20 items-center justify-center overflow-hidden rounded-2xl">
                  {p.image_url ? <img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover" /> : <Heart className="size-10 fill-primary text-primary" />}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold">{p.title}</h3>
                <div className="mt-2 flex justify-center text-primary"><Price bdt={p.from_bdt} usd={p.from_usd} compareBdt={p.compare_bdt} /></div>
                <ul className="mt-5 flex-1 space-y-2.5 text-left text-sm">
                  {[p.short_description, p.delivery_time_text, p.category_name, p.delivery_mode === "auto" ? "Instant auto delivery" : "Verified manual delivery", "24/7 support"].filter(Boolean).slice(0, 5).map((t) => (
                    <li key={t as string} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 fill-primary text-primary-foreground" /><span className="line-clamp-1">{t}</span></li>
                  ))}
                </ul>
                <Link to="/product/$slug" params={{ slug: p.slug }} className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-105">
                  <ShoppingCart className="size-4" /> Buy Now
                </Link>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-t border-border">
        <Reveal>
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-2">
            <div className="space-y-4">
              <span className="neon-border inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"><Star className="size-3.5 text-primary" /> Why Pixelline?</span>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Your Trusted Partner for <span className="text-primary">Lovable Credits</span></h2>
              <p className="text-muted-foreground">At Pixelline, we make it easy, safe, and simple to get your Lovable credits. Whether you're a solo builder or a growing team, we're here to support your journey.</p>
              <Link to="/shop" className="glow inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Get Started Now <ArrowRight className="size-4" /></Link>
            </div>
            <img src={whyImg} alt="Laptop showing Lovable" width={1200} height={800} loading="lazy" className="tilt w-full rounded-3xl" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
