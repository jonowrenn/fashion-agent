import { ITEM_CATEGORIES } from "@/lib/constants";

const categorySet = new Set<string>(ITEM_CATEGORIES);

export function parseListField(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

export function assertCategory(value: string): asserts value is (typeof ITEM_CATEGORIES)[number] {
  if (!categorySet.has(value)) {
    throw new Error(`Invalid category. Use one of: ${ITEM_CATEGORIES.join(", ")}`);
  }
}
