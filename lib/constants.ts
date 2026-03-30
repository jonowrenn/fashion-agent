export const ITEM_CATEGORIES = [
  "top",
  "bottom",
  "shoes",
  "outerwear",
  "accessory",
  "other",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const FORMALITY_OPTIONS = [
  "casual",
  "smart-casual",
  "business",
  "formal",
] as const;
