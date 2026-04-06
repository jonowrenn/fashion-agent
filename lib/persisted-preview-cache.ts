import { prisma } from "@/lib/prisma";
import type { ResolveProductPageResult } from "@/lib/resolve-product-page";

type PersistedPreviewValue = ResolveProductPageResult & {
  expiresAt: Date;
};

export async function getPersistedPreviewCache(
  url: string,
): Promise<PersistedPreviewValue | null> {
  const row = await prisma.productPreviewCache.findUnique({
    where: { url },
  });
  if (!row) return null;

  const value: PersistedPreviewValue = {
    ok: row.ok,
    title: row.title,
    imageUrl: row.imageUrl,
    status: row.status ?? undefined,
    error: row.error ?? undefined,
    expiresAt: row.expiresAt,
  };
  if (value.expiresAt.getTime() <= Date.now()) {
    await prisma.productPreviewCache.delete({
      where: { url },
    });
    return null;
  }

  return value;
}

export async function setPersistedPreviewCache(
  url: string,
  value: ResolveProductPageResult,
  ttlMs: number,
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMs);
  await prisma.productPreviewCache.upsert({
    where: { url },
    create: {
      url,
      title: value.title,
      imageUrl: value.imageUrl,
      ok: value.ok,
      status: value.status ?? null,
      error: value.error ?? null,
      expiresAt,
    },
    update: {
      title: value.title,
      imageUrl: value.imageUrl,
      ok: value.ok,
      status: value.status ?? null,
      error: value.error ?? null,
      expiresAt,
    },
  });
}
