import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminAddKeys, adminDeleteKey, adminListKeys } from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";
import { Btn, Empty, Field, Panel, Td, TableWrap, Th, areaClass, inputClass } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/stock")({
  component: Stock,
});

function Stock() {
  const listFn = useServerFn(adminListKeys);
  const addFn = useServerFn(adminAddKeys);
  const delFn = useServerFn(adminDeleteKey);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin-keys"], queryFn: () => listFn({}) });
  const [productId, setProductId] = useState("");
  const [values, setValues] = useState("");

  const available = (data?.keys ?? []).filter((k: any) => k.status === "available").length;

  return (
    <>
      <Panel
        title="Add license keys"
        description="Paste one key, login or code per line. Products set to auto delivery hand these out automatically after you verify a payment."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Product">
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
              <option value="">Choose a product</option>
              {(data?.products ?? []).map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.delivery_mode === "auto" ? "(auto)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Keys — one per line">
              <textarea value={values} onChange={(e) => setValues(e.target.value)} className={areaClass} />
            </Field>
          </div>
        </div>
        <Btn
          className="mt-4"
          disabled={!productId || !values.trim()}
          onClick={async () => {
            try {
              const res = await addFn({ data: { productId, values } });
              toast.success(`${res.added} key(s) added.`);
              setValues("");
              await queryClient.invalidateQueries({ queryKey: ["admin-keys"] });
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not add keys.");
            }
          }}
        >
          Add to stock
        </Btn>
      </Panel>

      <Panel title="License stock" description={`${available} key(s) available right now.`}>
        {isLoading ? (
          <Empty>Loading stock…</Empty>
        ) : data?.keys.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Key</Th>
                <Th>Product</Th>
                <Th>Status</Th>
                <Th>Order</Th>
                <Th>Added</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.keys.map((k: any) => {
                const product = data.products.find((p: any) => p.id === k.product_id);
                return (
                  <tr key={k.id}>
                    <Td className="max-w-[260px] break-all font-mono text-xs">{k.secret_value}</Td>
                    <Td>{product?.title ?? "—"}</Td>
                    <Td>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          k.status === "available"
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {k.status}
                      </span>
                    </Td>
                    <Td className="text-muted-foreground">{k.order_number ?? "—"}</Td>
                    <Td className="text-muted-foreground">{formatDate(k.created_at)}</Td>
                    <Td>
                      {k.status === "available" ? (
                        <Btn
                          variant="danger"
                          onClick={async () => {
                            await delFn({ data: { id: k.id } });
                            toast.success("Key removed.");
                            await queryClient.invalidateQueries({ queryKey: ["admin-keys"] });
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Btn>
                      ) : null}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <Empty>No keys stored yet.</Empty>
        )}
      </Panel>
    </>
  );
}
