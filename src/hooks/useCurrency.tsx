import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Currency } from "@/lib/format";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  isBangladesh: boolean;
  /** Bangladeshi visitors see BDT with USD next to it. */
  showBoth: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "BDT",
  setCurrency: () => {},
  isBangladesh: true,
  showBoth: true,
});

const STORAGE_KEY = "pl_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("BDT");
  const [isBangladesh, setIsBangladesh] = useState(true);

  useEffect(() => {
    let bd = true;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
      const lang = navigator.language ?? "";
      bd = tz === "Asia/Dhaka" || lang.toLowerCase().includes("bn");
    } catch {
      bd = true;
    }
    setIsBangladesh(bd);
    const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
    if (saved === "BDT" || saved === "USD") setCurrencyState(saved);
    else setCurrencyState(bd ? "BDT" : "USD");
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      isBangladesh,
      showBoth: isBangladesh,
      setCurrency: (c) => {
        setCurrencyState(c);
        try {
          localStorage.setItem(STORAGE_KEY, c);
        } catch {
          /* ignore */
        }
      },
    }),
    [currency, isBangladesh],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
