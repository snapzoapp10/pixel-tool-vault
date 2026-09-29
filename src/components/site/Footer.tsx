import { Link } from "@tanstack/react-router";
import { Clock, Mail, MessageCircle } from "lucide-react";
import type { SiteSettings } from "@/lib/public.functions";
import logoAsset from "@/assets/pixelline-wordmark.png.asset.json";

const paymentLabels = ["bKash", "Nagad", "Rocket", "Binance", "Bybit"];

export function Footer({ settings }: { settings?: Partial<SiteSettings> }) {
  return (
    <footer className="ink-panel">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <img src={logoAsset.url} alt="Pixelline" className="h-10 w-auto object-contain" />
          <p className="text-sm text-ink-muted">
            {settings?.tagline ?? "Genuine AI subscriptions, credits & tool licenses"} — trusted by creators,
            freelancers and agencies across Bangladesh.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/shop" search={{ category: "ai-subscription" }} className="hover:text-primary">
                AI Subscriptions
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "ai-credit" }} className="hover:text-primary">
                AI Credits
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "tools-license" }} className="hover:text-primary">
                Tools Licenses
              </Link>
            </li>
            <li>
              <Link to="/track" search={{ order: undefined, email: undefined }} className="hover:text-primary">
                Track your order
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/about" className="hover:text-primary">
                About us
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-primary">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/refund" className="hover:text-primary">
                Refund policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary">
                Terms & conditions
              </Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-primary">
                Guides & news
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">Support</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-primary" /> {settings?.support_hours ?? "10 AM - 2 AM"}
            </li>
            {settings?.email ? (
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-primary" /> {settings.email}
              </li>
            ) : null}
            {settings?.whatsapp ? (
              <li className="flex items-center gap-2">
                <MessageCircle className="size-4 text-primary" /> {settings.whatsapp}
              </li>
            ) : null}
          </ul>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {paymentLabels.map((p) => (
              <span key={p} className="rounded-md border border-white/15 px-2 py-1 text-[11px] font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Pixelline. All rights reserved.</p>
          <div className="flex gap-5"><Link to="/terms" className="hover:text-primary">Terms & Conditions</Link><Link to="/refund" className="hover:text-primary">Privacy Policy</Link></div>
        </div>
      </div>
    </footer>
  );
}
