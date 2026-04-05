import { prisma } from "@/lib/prisma";
import type { ResolveProductPageResult } from "@/lib/resolve-product-page";

type PersistedPreviewRow = {
  url: string;
  title: string | null;
  imageUrl: string | null;
  ok: number | boolean;
  status: number | null;
  error: string | null;
  expiresAt: string | Date;
};

type PersistedPreviewValue = ResolveProductPageResult & {
  expiresAt: Date;
};

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function toBoolean(value: number | boolean): boolean {
  return typeof value === "boolean" ? value : value === 1;
}

function mapRow(row: PersistedPreviewRow): PersistedPreviewValue {
  return {
    ok: toBoolean(row.ok),
    title: row.title,
    imageUrl: row.imageUrl,
    status: row.status ?? undefined,
    error: row.error ?? undefined,
    expiresAt: toDate(row.expiresAt),
  };
}

export async function getPersistedPreviewCache(
  url: string,
): Promise<PersistedPreviewValue | null> {
  const rows = await prisma.$queryRaw<PersistedPreviewRow[]>`
    SELECT url, title, imageUrl, ok, status, error, expiresAt
    FROM "ProductPreviewCache"
    WHERE url = ${url}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  const value = mapRow(row);
  if (value.expiresAt.getTime() <= Date.now()) {
    await prisma.$executeRaw`
      DELETE FROM "ProductPreviewCache"
      WHERE url = ${url}
    `;
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
  await prisma.$executeRaw`
    INSERT INTO "ProductPreviewCache" (
      url, title, imageUrl, ok, status, error, expiresAt, updatedAt
    )
    VALUES (
      ${url},
      ${value.title},
      ${value.imageUrl},
      ${value.ok ? 1 : 0},
      ${value.status ?? null},
      ${value.error ?? null},
      ${expiresAt},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT(url) DO UPDATE SET
      title = excluded.title,
      imageUrl = excluded.imageUrl,
      ok = excluded.ok,
      status = excluded.status,
      error = excluded.error,
      expiresAt = excluded.expiresAt,
      updatedAt = CURRENT_TIMESTAMP
  `;
}
