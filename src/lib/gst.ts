/** Indian GST reference data for forms and invoices (mirrors the backend's src/modules/gst/india.js). */

export const GST_STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
] as const;

export const STATE_OPTIONS = GST_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }));

export const stateName = (code?: string | null) => GST_STATES.find((s) => s.code === code)?.name ?? null;

/** Slabs offered in pickers. */
export const GST_RATE_OPTIONS = [0, 0.25, 3, 5, 12, 18, 28];

export const TAXABILITY_OPTIONS = [
  { value: "TAXABLE", label: "Taxable" },
  { value: "NIL_RATED", label: "Nil rated (0%)" },
  { value: "EXEMPT", label: "Exempt" },
  { value: "NON_GST", label: "Non-GST" },
] as const;

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Format, state code and the official mod-36 check digit. */
export function isValidGstin(value: string): boolean {
  const g = value.trim().toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
  if (!GST_STATES.some((s) => s.code === g.slice(0, 2))) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = CHARS.indexOf(g[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARS[(36 - (sum % 36)) % 36] === g[14];
}

export const isValidPan = (value: string) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value.trim().toUpperCase());

/** "1180.5" → "One Thousand One Hundred Eighty Rupees and Fifty Paise Only" (Indian numbering). */
export function amountInWords(amount: number | string): string {
  const n = Math.round(Number(amount) * 100);
  if (!Number.isFinite(n)) return "";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number) => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ""}`);
  const three = (x: number) => [x >= 100 ? `${ones[Math.floor(x / 100)]} Hundred` : "", two(x % 100)].filter(Boolean).join(" ");
  const words = (x: number): string => {
    if (x === 0) return "Zero";
    const parts: string[] = [];
    const crore = Math.floor(x / 10000000);
    const lakh = Math.floor((x % 10000000) / 100000);
    const thousand = Math.floor((x % 100000) / 1000);
    const rest = x % 1000;
    if (crore) parts.push(`${words(crore)} Crore`);
    if (lakh) parts.push(`${two(lakh)} Lakh`);
    if (thousand) parts.push(`${two(thousand)} Thousand`);
    if (rest) parts.push(three(rest));
    return parts.join(" ");
  };
  const rupees = Math.floor(n / 100);
  const paise = n % 100;
  return `${words(rupees)} Rupees${paise ? ` and ${two(paise)} Paise` : ""} Only`;
}
