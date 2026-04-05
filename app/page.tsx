import { getServerSession } from "next-auth";
import { WardrobeClient } from "@/components/WardrobeClient";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { itemToDTO } from "@/lib/types";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const initialItems = userId
    ? (
        await prisma.item.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
        })
      ).map(itemToDTO)
    : [];

  return (
    <WardrobeClient
      key={userId ?? "guest"}
      initialItems={initialItems}
      isAuthenticated={Boolean(userId)}
      userEmail={session?.user?.email ?? undefined}
    />
  );
}
