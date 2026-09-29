import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminOverview } from "@/lib/admin.functions";
import { formatDate, formatMoney, statusTone } from "@/lib/format";
import { Empty, Panel, Td, TableWrap, Th } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Overview() {
  const fn = useServerFn(adminOverview);
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn({}) });

  if (isLoading || !data) return <Empty>Loading your store numbers…</Empty>;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Awaiting verification" value={String(data.pending)} hint="Orders needing your check" />
        <Stat label="Orders today" value={String(data.todayOrders)} />
        <Stat label="Orders (30 days)" value={String(data.monthOrders)} />
        <Stat label="Customers" value={String(data.customers)} />
        <Stat label="Revenue (30d, BDT)" value={formatMoney(data.revenueBdt, "BDT")} hint="Verified & delivered" />
        <Stat label="Revenue (30d, USD)" value={formatMoney(data.revenueUsd, "USD")} hint="Verified & delivered" />
        <Stat label="Products" value={`${data.activeProducts}/${data.productCount}`} hint="Active / total" />
      </div>

      <Panel
        title="Latest orders"
        description="Newest first"
        action={
          <Link to="/admin/orders" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        }
      >
        {data.recent.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((o: any) => (
                <tr key={o.order_number}>
                  <Td className="font-semibold">{o.order_number}</Td>
                  <Td>{o.customer_name}</Td>
                  <Td>{formatMoney(Number(o.total), o.currency)}</Td>
                  <Td>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusTone[o.status]}`}>
                      {o.status}
                    </span>
                  </Td>
                  <Td className="text-muted-foreground">{formatDate(o.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <Empty>No orders yet. Share your product links to get your first sale.</Empty>
        )}
      </Panel>
    </>
  );
}
