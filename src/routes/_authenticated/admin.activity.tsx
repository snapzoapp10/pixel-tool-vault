import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListMisc } from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";
import { Empty, Panel, Td, TableWrap, Th } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  component: Activity,
});

function Activity() {
  const listFn = useServerFn(adminListMisc);
  const { data, isLoading } = useQuery({ queryKey: ["admin-misc"], queryFn: () => listFn({}) });

  return (
    <Panel title="Activity log" description="Every change made from this dashboard.">
      {isLoading ? (
        <Empty>Loading…</Empty>
      ) : data?.activity.length ? (
        <TableWrap>
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Who</Th>
              <Th>Action</Th>
              <Th>Item</Th>
            </tr>
          </thead>
          <tbody>
            {data.activity.map((a: any) => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap text-muted-foreground">{formatDate(a.created_at)}</Td>
                <Td>{a.actor_email ?? "system"}</Td>
                <Td className="capitalize">{a.action}</Td>
                <Td className="text-muted-foreground">
                  {a.entity}
                  {a.entity_id ? ` · ${a.entity_id}` : ""}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <Empty>Nothing logged yet.</Empty>
      )}
    </Panel>
  );
}
