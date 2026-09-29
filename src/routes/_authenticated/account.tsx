import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, LayoutDashboard, LogOut } from "lucide-react";
import { toast } from "sonner";
import { getMyAccess, myOrders } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatMoney, statusTone } from "@/lib/format";
import { Btn, Empty } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account — Pixel Line" },
      { name: "description", content: "Your Pixel Line orders, payment status and delivered products." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function Account() {
  const ordersFn = useServerFn(myOrders);
  const accessFn = useServerFn(getMyAccess);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => ordersFn({}) });
  const { data: access } = useQuery({ queryKey: ["my-access"], queryFn: () => accessFn({}) });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">My account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every order, payment status and delivery in one place.</p>
        </div>
        <div className="flex gap-2">
          {access?.isAdmin ? (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground"
            >
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
          ) : null}
          <Btn variant="ghost" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Btn>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <Empty>Loading your orders…</Empty>
        ) : data?.orders.length ? (
          data.orders.map((o: any) => (
            <div key={o.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-base font-semibold">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusTone[o.status]}`}>
                  {o.status}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {o.items.map((i: any) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>
                      {i.product_title} · {i.variant_name} × {i.quantity}
                    </span>
                    <span className="font-semibold">{formatMoney(Number(i.line_total), o.currency)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-border pt-3 text-sm font-semibold">
                Total {formatMoney(Number(o.total), o.currency)}
              </p>
              {o.delivered_content ? (
                <div className="mt-3 rounded-lg border border-success/40 bg-success/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-success">Your delivery</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(o.delivered_content);
                        toast.success("Copied");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      <Copy className="size-3.5" /> Copy
                    </button>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-sm">{o.delivered_content}</pre>
                </div>
              ) : null}
              {o.reject_reason ? (
                <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {o.reject_reason}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <Empty>
            No orders on this account yet.{" "}
            <Link to="/shop" className="font-semibold text-primary hover:underline">
              Browse products
            </Link>
          </Empty>
        )}
      </div>
    </div>
  );
}
