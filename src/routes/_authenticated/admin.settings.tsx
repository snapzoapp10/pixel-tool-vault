import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminListMisc, adminSaveSettings } from "@/lib/admin.functions";
import { Btn, Field, Panel, areaClass, inputClass } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: Settings,
});

const defaults = {
  site_name: "Pixel Line",
  tagline: "",
  support_hours: "10:00 AM - 11:00 PM (BD time)",
  whatsapp: "",
  messenger: "",
  email: "",
  usd_to_bdt: 120,
  announcement: "",
};

function Settings() {
  const listFn = useServerFn(adminListMisc);
  const saveFn = useServerFn(adminSaveSettings);
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-misc"], queryFn: () => listFn({}) });
  const [form, setForm] = useState(defaults);

  useEffect(() => {
    if (data?.settings) setForm({ ...defaults, ...(data.settings as any) });
  }, [data]);

  return (
    <Panel title="Store settings" description="Your brand name, contact channels, exchange rate and site-wide announcement.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Store name">
          <input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Tagline">
          <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Support hours">
          <input
            value={form.support_hours}
            onChange={(e) => setForm({ ...form, support_hours: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="USD → BDT rate" hint="Used to show an approximate second price.">
          <input
            type="number"
            value={form.usd_to_bdt}
            onChange={(e) => setForm({ ...form, usd_to_bdt: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="WhatsApp number" hint="With country code, e.g. 8801XXXXXXXXX">
          <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Messenger link">
          <input
            value={form.messenger}
            onChange={(e) => setForm({ ...form, messenger: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Support email">
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Announcement bar" hint="Leave empty to hide the top bar.">
          <textarea
            value={form.announcement}
            onChange={(e) => setForm({ ...form, announcement: e.target.value })}
            className={areaClass}
          />
        </Field>
      </div>
      <Btn
        className="mt-4"
        onClick={async () => {
          try {
            await saveFn({ data: { ...form, usd_to_bdt: Number(form.usd_to_bdt) } });
            toast.success("Settings saved.");
            await queryClient.invalidateQueries();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not save settings.");
          }
        }}
      >
        Save settings
      </Btn>
    </Panel>
  );
}
