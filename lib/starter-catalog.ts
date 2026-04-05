import type { ItemCategory } from "@/lib/constants";

/**
 * Curated retailer product URLs. Tiles only show when a live product image resolves.
 */
export type StarterTemplate = {
  id: string;
  brand: string;
  retailerProductTitle: string;
  productUrl: string;
  category: ItemCategory;
  colors: string;
  seasons: string;
  formality: string | null;
  notes: string | null;
  tags: string;
};

export const STARTER_ITEMS: StarterTemplate[] = [
  {
    id: "starter-uniqlo-airism-tee",
    brand: "UNIQLO",
    retailerProductTitle: "AIRism Cotton Relaxed T-Shirt",
    productUrl:
      "https://www.uniqlo.com/us/en/products/E467134-000/00?colorDisplayCode=00&sizeDisplayCode=006",
    category: "top",
    colors: "varies by colorway",
    seasons: "spring, summer, fall",
    formality: "casual",
    notes: null,
    tags: "starter, uniqlo, mens, basics",
  },
  {
    id: "starter-uniqlo-merino-crew",
    brand: "UNIQLO",
    retailerProductTitle: "Extra Fine Merino Crew Neck Long-Sleeve Sweater",
    productUrl: "https://www.uniqlo.com/us/en/products/E429066-000/00",
    category: "top",
    colors: "varies",
    seasons: "fall, winter, spring",
    formality: "smart-casual",
    notes: null,
    tags: "starter, uniqlo, mens, knit",
  },
  {
    id: "starter-uniqlo-cotton-crew-sweater",
    brand: "UNIQLO",
    retailerProductTitle: "Crew Neck Sweater",
    productUrl: "https://www.uniqlo.com/us/en/products/E476179-000/00",
    category: "top",
    colors: "varies",
    seasons: "fall, winter, spring",
    formality: "casual",
    notes: null,
    tags: "starter, uniqlo, mens, knit",
  },
  {
    id: "starter-uniqlo-slim-jeans",
    brand: "UNIQLO",
    retailerProductTitle: "Slim-Fit Jeans",
    productUrl:
      "https://www.uniqlo.com/us/en/products/E441741-000/00?colorDisplayCode=64&sizeDisplayCode=029",
    category: "bottom",
    colors: "varies by wash",
    seasons: "spring, summer, fall, winter",
    formality: "casual",
    notes: null,
    tags: "starter, uniqlo, mens, denim",
  },
  {
    id: "starter-uniqlo-sneakers",
    brand: "UNIQLO",
    retailerProductTitle: "Sneakers",
    productUrl: "https://www.uniqlo.com/us/en/products/E466623-000/00?colorDisplayCode=01",
    category: "shoes",
    colors: "varies",
    seasons: "spring, summer, fall",
    formality: "casual",
    notes: null,
    tags: "starter, uniqlo, mens, sneakers",
  },
  {
    id: "starter-uniqlo-ultra-light-down",
    brand: "UNIQLO",
    retailerProductTitle: "Ultra Light Down Jacket",
    productUrl:
      "https://www.uniqlo.com/us/en/products/E450310-000/00?colorDisplayCode=05&sizeDisplayCode=003",
    category: "outerwear",
    colors: "navy, olive, off-white (varies)",
    seasons: "fall, winter",
    formality: "casual",
    notes: null,
    tags: "starter, uniqlo, mens, packable",
  },
  {
    id: "starter-uniqlo-leather-belt",
    brand: "UNIQLO",
    retailerProductTitle: "Italian Leather Vintage Belt",
    productUrl:
      "https://www.uniqlo.com/us/en/products/E453679-000/00?colorDisplayCode=09&sizeDisplayCode=006",
    category: "accessory",
    colors: "black, brown (varies)",
    seasons: "spring, summer, fall, winter",
    formality: "casual",
    notes: null,
    tags: "starter, uniqlo, mens, belt",
  },
  {
    id: "starter-jcrew-broken-in-oxford",
    brand: "J.Crew",
    retailerProductTitle: "Broken-in organic cotton Oxford shirt",
    productUrl:
      "https://www.jcrew.com/p/mens/categories/clothing/shirts/broken-in-oxford/brokenin-organic-cotton-oxford-shirt/BE996?color_name=white&display=standard",
    category: "top",
    colors: "varies",
    seasons: "spring, summer, fall, winter",
    formality: "smart-casual",
    notes: null,
    tags: "starter, jcrew, mens, oxford",
  },
];

export function getStarterById(id: string): StarterTemplate | undefined {
  return STARTER_ITEMS.find((s) => s.id === id);
}

export function starterFallbackName(s: StarterTemplate): string {
  return `${s.brand} — ${s.retailerProductTitle}`;
}
