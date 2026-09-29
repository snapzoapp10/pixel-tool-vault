import { useCurrency } from "@/hooks/useCurrency";
import { formatMoney } from "@/lib/format";

type Props = {
  bdt: number;
  usd: number;
  compareBdt?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

export function Price({ bdt, usd, compareBdt, className = "", size = "md" }: Props) {
  const { currency, showBoth } = useCurrency();
  const primary = currency === "BDT" ? formatMoney(bdt, "BDT") : formatMoney(usd, "USD");
  const secondary = currency === "BDT" ? formatMoney(usd, "USD") : null;

  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`font-display font-semibold tracking-tight ${sizes[size]}`}>{primary}</span>
      {showBoth && secondary ? (
        <span className="text-sm text-muted-foreground">≈ {secondary}</span>
      ) : null}
      {compareBdt && currency === "BDT" ? (
        <span className="text-sm text-muted-foreground line-through">{formatMoney(compareBdt, "BDT")}</span>
      ) : null}
    </div>
  );
}
