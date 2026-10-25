/** Toman is the primary price everywhere; the native regional price is secondary. */
export function formatToman(value: number | null | undefined, locale = "fa-IR"): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(locale).format(value) + (locale.startsWith("fa") ? " تومان" : " Toman");
}

export function formatNative(value: number | null | undefined, currency: string | null | undefined): string | null {
  if (value === null || value === undefined || !currency) return null;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
