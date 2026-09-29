import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { adminListCustomers, adminToggleBlock } from "@/lib/admin.functions";
import { formatDate, formatMoney } from "@/lib/format";
import { Btn, Empty, Panel, Td, TableWrap, Th, inputClass } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: Customers,
});

function Customers() {
  const listFn = useServerFn(adminListCustomers);
  const blockFn = useServerFn(adminToggleBlock);
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-customers"], queryFn: () => listFn({}) });

  const rows = (data?.customers ?? []).filter((c: any) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return [c.email, c.name, c.phone].some((v: string) => String(v ?? "").toLowerCase().includes(term));
  });

  return (
    <Panel
      title="Customers"
      description="Everyone who ordered — with account holders, spend and order counts."
      action={
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email or phone"
            className={`${inputClass} pl-9`}
          />
        </div>
      }
    >
      {isLoading ? (
        <Empty>Loading customers…</Empty>
      ) : rows.length ? (
        <TableWrap>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Contact</Th>
              <Th>Orders</Th>
              <Th>Spent</Th>
              <Th>Last order</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c: any) => (
              <tr key={c.email}>
                <Td className="font-semibold">
                  {c.name || "—"}
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {c.has_account ? "Registered account" : "Guest checkout"}
                    {c.is_blocked ? " · blocked" : ""}
                  </span>
                </Td>
                <Td>
                  {c.email}
                  {c.phone ? <span className="mt-0.5 block text-xs text-muted-foreground">{c.phone}</span> : null}
                </Td>
                <Td>{c.orders}</Td>
                <Td>
                  {formatMoney(c.spent_bdt, "BDT")}
                  {c.spent_usd ? <span className="block text-xs">{formatMoney(c.spent_usd, "USD")}</span> : null}
                </Td>
                <Td className="text-muted-foreground">{formatDate(c.last_order)}</Td>
                <Td>
                  {c.profile_id ? (
                    <Btn
                      variant={c.is_blocked ? "ghost" : "danger"}
                      onClick={async () => {
                        await blockFn({ data: { profileId: c.profile_id, blocked: !c.is_blocked } });
                        toast.success(c.is_blocked ? "Customer unblocked." : "Customer blocked.");
                        await queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
                      }}
                    >
                      {c.is_blocked ? "Unblock" : "Block"}
                    </Btn>
                  ) : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <Empty>No customers yet.</Empty>
      )}
    </Panel>
  );
}
