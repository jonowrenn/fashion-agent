import { WardrobeClient } from "@/components/WardrobeClient";
import { prisma } from "@/lib/prisma";
import { itemToDTO } from "@/lib/types";

export default async function Home() {
  const rows = await prisma.item.findMany({ orderBy: { updatedAt: "desc" } });
  const initialItems = rows.map(itemToDTO);

  return <WardrobeClient initialItems={initialItems} />;
}
