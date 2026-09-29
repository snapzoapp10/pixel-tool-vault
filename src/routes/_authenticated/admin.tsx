import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgePercent,
  Blocks,
  FileText,
  Gauge,
  KeyRound,
  LogOut,
  MessageSquareQuote,
  Package,
  ScrollText,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { claimFirstAdmin, getMyAccess } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Btn } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard — Pixel Line" },
      { name: "description", content: "Pixel Line store dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Overview", icon: Gauge, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/stock", label: "License stock", icon: KeyRound },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/coupons", label: "Coupons", icon: BadgePercent },
  { to: "/admin/payments", label: "Payment methods", icon: Wallet },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/activity", label: "Activity log", icon: ScrollText },
] as const;

function AdminLayout() {
  const accessFn = useServerFn(getMyAccess);
  const claimFn = useServerFn(claimFirstAdmin);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: access, isLoading } = useQuery({ queryKey: ["my-access"], queryFn: () => accessFn({}) });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Checking your access…</div>;
  }

  if (!access?.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Blocks className="mx-auto size-8 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold">Dashboard access</h1>
        {access?.adminExists ? (
          <p className="mt-2 text-sm text-muted-foreground">
            This account is not an administrator. Sign in with the owner account to open the dashboard.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              No owner has been set for this store yet. Claim it with this account — this can only be done once.
            </p>
            <Btn
              className="mt-5"
              onClick={async () => {
                try {
                  await claimFn({});
                  await queryClient.invalidateQueries({ queryKey: ["my-access"] });
                  toast.success("You are now the store owner.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not claim ownership.");
                }
              }}
            >
              Make me the owner
            </Btn>
          </>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/account" className="text-sm font-semibold text-primary hover:underline">
            Back to my account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-display text-base font-bold">
            Pixel Line <span className="text-muted-foreground">· dashboard</span>
          </Link>
          <Btn variant="ghost" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Btn>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: (n as any).exact ?? false }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: (n as any).exact ?? false }}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 space-y-5 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
