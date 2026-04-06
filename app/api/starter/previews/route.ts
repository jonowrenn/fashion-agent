import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { STARTER_ITEMS } from "@/lib/starter-catalog";
import type { StarterPreview } from "@/lib/starter-preview";
import { resolveProductPage } from "@/lib/resolve-product-page";

/**
 * Resolves product image + title for each curated product URL.
 * Cached 1h to avoid hammering retailer sites.
 */
async function fetchAllPreviews(): Promise<Record<string, StarterPreview>> {
  const results = await Promise.all(
    STARTER_ITEMS.map(async (s) => {
      const r = await withTimeout(
        resolveProductPage(s.productUrl, {
          fetchTimeoutMs: 5_500,
          browserTimeoutMs: 7_000,
        }),
        9_000,
        {
          ok: false,
          title: null,
          imageUrl: null,
          error: "Preview timeout",
        },
      );
      return [
        s.id,
        {
          imageUrl: r.imageUrl,
          title: r.title,
          ok: r.ok,
        } satisfies StarterPreview,
      ] as const;
    }),
  );
  return Object.fromEntries(results);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const getCachedPreviews = unstable_cache(
  async () => fetchAllPreviews(),
  ["starter-product-previews-rendered-fallback-v6"],
  { revalidate: 900 },
);

export async function GET() {
  try {
    const previews = await getCachedPreviews();
    return NextResponse.json({ previews });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Preview fetch failed";
    return NextResponse.json({ previews: {} as Record<string, StarterPreview>, error: message });
  }
}
