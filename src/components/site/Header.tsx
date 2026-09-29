import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, ShieldCheck, User2, X } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/track", label: "Track Order" },
  { to: "/blog", label: "Blog" },
  { to: "/faq", label: "FAQ" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header({ announcement }: { announcement?: string }) {
  const [open, setOpen] = useState(false);
  const { currency, setCurrency, isBangladesh } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50">
      {announcement ? (
        <div className="ink-panel border-b border-white/10 px-4 py-2 text-center text-xs font-medium sm:text-sm">
          {announcement}
        </div>
      ) : null}

      <div className="border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-brand glow font-display text-lg font-black text-primary-foreground">P</span>
            <span className="leading-tight">
              <span className="block font-display text-xl font-bold tracking-tight">Pixel<span className="text-primary">line</span></span>
              <span className="block text-[11px] text-muted-foreground">AI subscriptions & licenses</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeProps={{ className: "!text-primary border-b-2 border-primary rounded-none" }}
                activeOptions={{ exact: l.to === "/" }}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isBangladesh ? (
              <div className="hidden overflow-hidden rounded-md border border-border sm:flex">
                {(["BDT", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      currency === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}

            <Link
              to={user ? "/account" : "/auth"}
              className="hidden items-center gap-1.5 rounded-full border border-primary/60 px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary sm:inline-flex"
            >
              <User2 className="size-4" />
              {user ? "Account" : "Sign in"}
            </Link>

            <Link
              to="/shop"
              className="hidden rounded-full bg-primary px-5 py-2 text-sm font-bold glow text-primary-foreground transition-opacity hover:opacity-90 sm:inline-flex"
            >
              Buy Now
            </Link>

            <button
              type="button"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex size-10 items-center justify-center rounded-md border border-border md:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-border bg-card px-4 py-3 md:hidden">
            <nav className="flex flex-col">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to={user ? "/account" : "/auth"}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {user ? "My account" : "Sign in / Sign up"}
              </Link>
              {user ? (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <ShieldCheck className="size-4" /> Admin dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="rounded-md px-2 py-2.5 text-left text-sm font-medium text-destructive hover:bg-secondary"
                  >
                    Sign out
                  </button>
                </>
              ) : null}
            </nav>
            {isBangladesh ? (
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Currency</span>
                {(["BDT", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      currency === c ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
