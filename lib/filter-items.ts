import type { ItemDTO } from "@/lib/types";

export function filterWardrobe(
  items: ItemDTO[],
  query: string,
  category: "all" | string,
): ItemDTO[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!q) return true;
    const hay = [
      item.name,
      item.brand ?? "",
      item.colors,
      item.tags,
      item.notes ?? "",
      item.category,
      item.seasons,
      item.formality ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
