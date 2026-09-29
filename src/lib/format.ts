export type Currency = "BDT" | "USD";

export function formatMoney(amount: number, currency: Currency): string {
  const value = Number(amount || 0);
  if (currency === "BDT") {
    return `৳${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const statusTone: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  verified: "bg-primary/10 text-primary border-primary/30",
  delivered: "bg-success/15 text-success border-success/40",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};
