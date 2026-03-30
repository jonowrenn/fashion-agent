import type { Item } from "@/app/generated/prisma/client";

export type ItemDTO = Omit<Item, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export function itemToDTO(item: Item): ItemDTO {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
