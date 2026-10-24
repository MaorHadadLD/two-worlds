/**
 * A slice of the Protein Market catalog (~/Development/protein-market/lib/catalog.ts).
 * Brand, name, flavour, size and protein match the photographed packs there;
 * prices are that project's demo prices. Photos: Open Food Facts contributors, CC BY-SA 3.0.
 */
export type Product = {
  id: string;
  brand: string;
  name: string;
  short: string;
  kind: string;
  flavor: string;
  size: string;
  price: number;
  protein?: string;
  image: { src: string; w: number; h: number };
  plate: string;
};

export const products: Product[] = [
  {
    id: "yfood-crazy-coconut",
    brand: "yfood",
    name: "Crazy Coconut",
    short: "משקה קוקוס",
    kind: "משקה ארוחה מוכן",
    flavor: "קוקוס",
    size: "500 מ״ל",
    price: 16.9,
    protein: "34 ג׳ חלבון לבקבוק",
    image: { src: "/pm/products/yfood-crazy-coconut-500ml.webp", w: 392, h: 997 },
    plate: "#c5d2d9",
  },
  {
    id: "weider-yippie",
    brand: "Weider",
    name: "Yippie! Bar",
    short: "חטיף לבה",
    kind: "חטיף חלבון",
    flavor: "שוקולד לבה",
    size: "70 ג׳",
    price: 12.9,
    protein: "26 ג׳ חלבון לחטיף",
    image: { src: "/pm/products/weider-yippie-chocolate-lava-70g.webp", w: 999, h: 710 },
    plate: "#d8c7bb",
  },
  {
    id: "nu3-performance-whey",
    brand: "nu3",
    name: "Performance Whey",
    short: "אבקת תות",
    kind: "אבקת חלבון מי גבינה",
    flavor: "תות",
    size: "1 ק״ג",
    price: 169,
    protein: "74.1 ג׳ חלבון ל־100 ג׳",
    image: { src: "/pm/products/nu3-performance-whey-strawberry-1kg.webp", w: 375, h: 521 },
    plate: "#e0c9c4",
  },
  {
    id: "scitec-whey-isolate",
    brand: "Scitec Nutrition",
    name: "100% Whey Isolate",
    short: "איזולט תות",
    kind: "אבקת חלבון איזולט",
    flavor: "תות",
    size: "2 ק״ג",
    price: 349,
    image: { src: "/pm/products/scitec-100-whey-isolate-strawberry-2kg.webp", w: 635, h: 933 },
    plate: "#cbd8c2",
  },
];

/** Formatted by hand: server and browser ICU data can disagree, and a price must never flicker on hydration. */
export const price = (n: number) => {
  const r = Math.round(n * 100) / 100;
  const s = Number.isInteger(r) ? String(r) : r.toFixed(2);
  return `₪${s.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};
