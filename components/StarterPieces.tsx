"use client";

import { useEffect, useMemo, useState } from "react";
import type { ItemDTO } from "@/lib/types";
import { STARTER_ITEMS } from "@/lib/starter-catalog";
import type { StarterPreview } from "@/lib/starter-preview";

type Props = {
  onAdded: (item: ItemDTO) => void;
  /** Called when the API returns 401 (e.g. prompt user to sign in). */
  onUnauthorized?: () => void;
  /** Discover: four product photos across on md+, image-forward tiles. */
  layout?: "default" | "photoGrid";
};

export function StarterPieces({
  onAdded,
  onUnauthorized,
  layout = "default",
}: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, StarterPreview> | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/starter/previews");
        const json = (await res.json()) as {
          previews?: Record<string, StarterPreview>;
          error?: string;
        };
        if (cancelled) return;
        setPreviews(json.previews ?? {});
        if (json.error) setPreviewError(json.error);
      } catch {
        if (!cancelled) setPreviewError("Could not load product images.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Only starters whose retailer pages return a usable live product image. */
  const visibleStarters = useMemo(() => {
    if (!previews) return null;
    return STARTER_ITEMS.filter((s) => Boolean(previews[s.id]?.imageUrl));
  }, [previews]);

  async function addStarter(starterId: string) {
    setLoadingId(starterId);
    setError(null);
    try {
      const res = await fetch("/api/starter/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starterId }),
      });
      const json = (await res.json()) as { item?: ItemDTO; error?: string };
      if (res.status === 401) {
        onUnauthorized?.();
        throw new Error("Sign in to add pieces to your wardrobe.");
      }
      if (!res.ok) throw new Error(json.error ?? "Could not add");
      if (json.item) onAdded(json.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  const gridClass =
    layout === "photoGrid"
      ? "grid grid-cols-2 gap-3 md:grid-cols-4"
      : "grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4";
  const cardRounded = layout === "photoGrid" ? "rounded-xl" : "rounded-lg";

  if (visibleStarters === null) {
    return (
      <div className="rounded-xl border border-stone-200/80 bg-stone-100/50 px-4 py-10 text-center">
        <p className="text-sm font-medium text-stone-700">Loading product previews…</p>
        <p className="mt-1 text-xs text-stone-500">
          Showing curated pieces once retailer photos load.
        </p>
      </div>
    );
  }

  if (visibleStarters.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200/80 bg-stone-100/50 px-4 py-10 text-center">
        <p className="text-sm font-medium text-stone-800">No previews available</p>
        <p className="mt-1 text-xs text-stone-600">
          Product images did not load from the current retailer listings. Refresh or try later.
        </p>
      </div>
    );
  }

  return (
    <div>
      {previewError ? (
        <p className="mb-4 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
          {previewError}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <ul className={gridClass}>
        {visibleStarters.map((s) => {
          const pv = previews![s.id]!;
          const imageUrl = pv.imageUrl!;
          const headline =
            (pv.title && pv.title.trim()) || `${s.brand} — ${s.retailerProductTitle}`;

          return (
            <li key={s.id}>
              <article
                className={`flex h-full flex-col overflow-hidden border border-stone-300/70 bg-stone-50 shadow-sm ${cardRounded}`}
              >
                <div className="relative aspect-square overflow-hidden bg-stone-200/80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={headline}
                    className="h-full w-full object-cover"
                  />
                  <div
                    className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-1.5 text-white ${
                      layout === "photoGrid" ? "pb-5 pt-10" : "pb-6 pt-8"
                    }`}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wide text-white/95">
                      {s.brand}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-snug text-white">
                      {headline}
                    </p>
                  </div>
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-white">
                    {s.category}
                  </span>
                </div>
                <div
                  className={`flex flex-col gap-1 border-t border-stone-200/80 ${
                    layout === "photoGrid" ? "p-2.5" : "p-2"
                  }`}
                >
                  <button
                    type="button"
                    disabled={loadingId !== null}
                    onClick={() => void addStarter(s.id)}
                    className={`rounded-md bg-rose-700 font-semibold text-white hover:bg-rose-800 disabled:opacity-50 ${
                      layout === "photoGrid"
                        ? "px-2 py-2 text-[11px]"
                        : "px-2 py-1.5 text-[10px]"
                    }`}
                  >
                    {loadingId === s.id ? "…" : "Add to wardrobe"}
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-center text-xs text-stone-500">
        Tiles appear only when a live retailer product image loads. If a preview fails, you can
        still add the piece from its retailer page.
      </p>
    </div>
  );
}
