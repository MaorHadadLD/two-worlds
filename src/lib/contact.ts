export const EMAIL = "maorhadad94@gmail.com";
export const PROTEIN_MARKET_URL = "https://protein-market.vercel.app/";

/** A mail link that opens the visitor's own mail app with the brief already written in. */
export function mailto(subject?: string, body?: string) {
  const q = [subject && `subject=${encodeURIComponent(subject)}`, body && `body=${encodeURIComponent(body)}`].filter(Boolean).join("&");
  return `mailto:${EMAIL}${q ? `?${q}` : ""}`;
}
