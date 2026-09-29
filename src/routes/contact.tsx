import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Facebook, Mail, MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/public.functions";

const settingsQuery = queryOptions({ queryKey: ["settings"], queryFn: () => getSiteSettings() });

export const Route = createFileRoute("/contact")({
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  head: () => ({
    meta: [
      { title: "Contact Pixel Line — Support & Pre-Sale Questions" },
      {
        name: "description",
        content:
          "Message Pixel Line on WhatsApp, Messenger or email for pre-sale questions, order help and payment verification.",
      },
      { property: "og:title", content: "Contact Pixel Line" },
      { property: "og:description", content: "Reach our support team on WhatsApp, Messenger or email." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const { data: settings } = useSuspenseQuery(settingsQuery);

  const channels = [
    settings.whatsapp
      ? { icon: MessageCircle, label: "WhatsApp", value: settings.whatsapp, href: `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}` }
      : null,
    settings.messenger ? { icon: Facebook, label: "Facebook Messenger", value: "Pixel Line", href: settings.messenger } : null,
    settings.email ? { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` } : null,
  ].filter(Boolean) as { icon: any; label: string; value: string; href: string }[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Contact us</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Questions before buying, or need help with an order? Reach us on any channel below.
      </p>

      <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
        <Clock className="size-4 text-primary" /> Support hours: {settings.support_hours}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {channels.length ? (
          channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
            >
              <c.icon className="size-5 text-primary" />
              <h2 className="mt-3 font-display text-base font-semibold">{c.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.value}</p>
            </a>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
            Contact channels have not been added yet. Add your WhatsApp, Messenger link and email in the dashboard
            settings and they will show here.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-display text-lg font-semibold">Already paid but no delivery yet?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the track order page with your order number and email — the live status shows whether your payment is
          still being verified. If it has been longer than the delivery time shown on the product, message us with
          your order number.
        </p>
      </div>
    </div>
  );
}
