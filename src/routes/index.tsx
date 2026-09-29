import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Code2,
  Crown,
  Headphones,
  Play,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero-visual.jpg";
import whyImg from "@/assets/why-visual.jpg";
import { Reveal } from "@/components/site/Reveal";
import { getStorefront } from "@/lib/public.functions";

const storefrontQuery = queryOptions({
  queryKey: ["storefront"],
  queryFn: () => getStorefront(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({
    meta: [
      { title: "Pixelline — Buy Lovable Credits and Build Faster" },
      { name: "description", content: "Buy genuine Lovable credits securely with instant delivery and 24/7 support from Pixelline." },
      { property: "og:title", content: "Pixelline — Buy Lovable Credits and Build Faster" },
      { property: "og:description", content: "Original Lovable credits, secure payment and fast delivery." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Zap, title: "Instant Delivery", text: "Get your credits immediately after payment." },
  { icon: ShieldCheck, title: "100% Secure", text: "We use trusted and secure payment gateways." },
  { icon: Code2, title: "Official Credits", text: "Original Lovable credits, no risk, no hassle." },
  { icon: Headphones, title: "24/7 Support", text: "Need help? Our team is always ready to assist you." },
];

const plans = [
  { name: "Pro Plan", price: "$59.00", credits: "1,000 Lovable Credits", validity: "1 Month Validity", popular: true },
  { name: "Light Plan", price: "$19.00", credits: "250 Lovable Credits", validity: "1 Month Validity" },
  { name: "12 Month Pro Plan", price: "$149.00", credits: "3,000 Lovable Credits", validity: "12 Month Validity" },
  { name: "10K Credit Pro Plan", price: "$399.00", credits: "10,000 Lovable Credits", validity: "12 Month Validity" },
];

function HeroArtwork() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const onScroll = () => setOffset(Math.min(window.scrollY, 500));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="hero-art [perspective:1200px]">
      <img
        src={heroImg}
        alt="Lovable 100 credits"
        width={1200}
        height={912}
        fetchPriority="high"
        className="w-full rounded-2xl"
        style={{ transform: `rotateY(${-3 + offset * 0.012}deg) translateY(${offset * -0.05}px)` }}
      />
    </div>
  );
}

function Home() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const products = data.featured.length ? data.featured : data.latest;

  return (
    <div className="home-reference">
      <section className="hero-band overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="relative z-10 animate-fade-in">
            <span className="reference-pill"><Zap className="size-4 fill-primary" /> Fast <i /> Secure <i /> Reliable</span>
            <h1 className="mt-6 max-w-xl font-display text-5xl font-extrabold leading-[1.06] sm:text-6xl lg:text-7xl">
              Buy Lovable Credits and <span className="text-primary">Build Faster</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Get Lovable Credits instantly and supercharge your AI-powered development. Build, ship, and turn your ideas into real products — faster than ever.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
              {["Instant Delivery", "Secure Payment", "100% Genuine Credits"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" /></span>{item}</span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop" className="glow inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-extrabold text-primary-foreground transition-transform hover:scale-105"><ShoppingCart className="size-5" /> Buy Lovable Credits <ArrowRight className="size-4" /></Link>
              <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-primary px-7 py-4 text-sm font-bold hover:bg-secondary"><Play className="size-4 fill-primary text-primary" /> Learn More</Link>
            </div>
          </div>
          <HeroArtwork />
        </div>
      </section>

      <section className="border-b border-border bg-background/80">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex gap-4 lg:block">
              <span className="feature-icon"><feature.icon className="size-7" /></span>
              <div><h2 className="mt-1 font-display text-xl font-bold lg:mt-4">{feature.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{feature.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="plans-band border-b border-border px-5 py-16">
        <Reveal>
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <span className="reference-pill"><Crown className="size-4" /> Our Plans</span>
              <h2 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">Choose Your <span className="text-primary">Lovable Credits</span> Plan</h2>
              <p className="mt-3 text-muted-foreground">Select the perfect plan for your needs. More credits, more possibilities.</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan, index) => {
                const product = products[index] ?? products[0];
                const card = (
                  <article className={`plan-card ${plan.popular ? "plan-card-popular" : ""}`}>
                    {plan.popular ? <span className="popular-label"><Star className="size-3.5 fill-primary-foreground" /> Most Popular</span> : null}
                    <div className="lovable-mark"><span>♥</span></div>
                    <h3 className="mt-4 font-display text-xl font-extrabold">{plan.name}</h3>
                    <p className="mt-2 font-display text-3xl font-extrabold text-primary">{plan.price}</p>
                    <ul className="mt-5 flex-1 space-y-3 text-sm">
                      {[plan.credits, plan.validity, "Custom Domain", "Personal Email", "Workspace Transfer"].map((item) => (
                        <li key={item} className="flex items-center gap-2"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3" /></span>{item}</li>
                      ))}
                    </ul>
                    <span className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-extrabold text-primary-foreground"><ShoppingCart className="size-5" /> Buy Now</span>
                  </article>
                );
                return product ? <Link key={plan.name} to="/product/$slug" params={{ slug: product.slug }} className="block">{card}</Link> : <Link key={plan.name} to="/shop" className="block">{card}</Link>;
              })}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="why-band border-b border-border">
        <Reveal>
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <span className="reference-pill"><Star className="size-4 fill-primary" /> Why Pixelline?</span>
              <h2 className="mt-4 max-w-lg font-display text-4xl font-extrabold leading-tight">Your Trusted Partner for <span className="text-primary">Lovable Credits</span></h2>
              <p className="mt-3 max-w-xl leading-7 text-muted-foreground">At Pixelline, we make it easy, safe, and simple to get your Lovable credits. Whether you're a solo builder or a growing team, we're here to support your journey.</p>
              <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-extrabold text-primary-foreground">Get Started Now <ArrowRight className="size-4" /></Link>
            </div>
            <div className="relative"><img src={whyImg} alt="Laptop showing Lovable" width={1200} height={800} loading="lazy" className="w-full rounded-2xl" /><span className="absolute right-4 top-4 hidden rounded-xl border border-primary/60 bg-background/80 p-4 text-sm backdrop-blur sm:block"><Sparkles className="mb-2 size-5 text-primary" /> Build faster<br />Save time<br />Create amazing things</span></div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}