/** Money is stored as integer cents (KES). Never floats. */

export function formatMoney(cents: number, currency = "KES"): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const shillings = Math.floor(abs / 100);
  const rem = abs % 100;
  const grouped = shillings.toLocaleString("en-KE");
  return `${sign}${currency} ${grouped}${rem ? `.${String(rem).padStart(2, "0")}` : ""}`;
}

/** Parses "12,000", "12000.50", "KES 500" → cents; null when invalid. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[^\d.]/g, "");
  if (!cleaned || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const cents = parseInt(whole, 10) * 100 + parseInt(frac.padEnd(2, "0") || "0", 10);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
