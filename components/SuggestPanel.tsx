"use client";

import { useState } from "react";
import type { ItemDTO } from "@/lib/types";

type Outfit = {
  title: string;
  rationale: string;
  item_ids: string[];
  items: ItemDTO[];
};

type Props = {
  hasItems: boolean;
};

function OutfitSkeleton() {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4">
      <div className="h-5 w-2/3 animate-pulse rounded bg-stone-200" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-stone-100" />
      <div className="mt-3 flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-24 shrink-0 overflow-hidden rounded-lg border border-stone-200/80 bg-stone-50"
          >
            <div className="aspect-square animate-pulse bg-stone-200" />
            <div className="space-y-1 p-2">
              <div className="h-3 animate-pulse rounded bg-stone-100" />
              <div className="h-2 w-2/3 animate-pulse rounded bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuggestPanel({ hasItems }: Props) {
  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaps, setGaps] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  async function submit() {
    if (!occasion.trim()) {
      setError("Describe the occasion or day.");
      return;
    }
    setBusy(true);
    setError(null);
    setOutfits([]);
    setGaps([]);
    setNotes("");
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: occasion.trim(),
          weather: weather.trim() || undefined,
          extra: extra.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        outfits?: Outfit[];
        wardrobe_gaps?: string[];
        notes?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        if (res.status === 401 && json.code === "UNAUTHORIZED") {
          throw new Error("Your session expired—refresh the page and sign in again.");
        }
        throw new Error(json.error ?? "Request failed");
      }
      setOutfits(json.outfits ?? []);
      setGaps(json.wardrobe_gaps ?? []);
      setNotes(json.notes ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const formDisabled = !hasItems || busy;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Occasion
          <input
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            disabled={formDisabled}
            className="rounded-lg border border-stone-300/80 bg-stone-100 px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2 disabled:opacity-50"
            placeholder="Office day, date night, travel…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Weather (optional)
          <input
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            disabled={formDisabled}
            className="rounded-lg border border-stone-300/80 bg-stone-100 px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2 disabled:opacity-50"
            placeholder="Rainy, 45°F, humid…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Extra context (optional)
          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            disabled={formDisabled}
            rows={2}
            className="resize-y rounded-lg border border-stone-300/80 bg-stone-100 px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2 disabled:opacity-50"
            placeholder="Must wear boots, avoid wool, etc."
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={formDisabled}
        className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {busy ? "Generating outfits…" : "Get outfit ideas"}
      </button>
      {!hasItems ? (
        <p className="text-sm text-stone-500">
          Add a few pieces first so the assistant can see your real wardrobe.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50/80 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {busy ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <p className="text-sm text-stone-500">Building looks from your closet…</p>
          <OutfitSkeleton />
          <OutfitSkeleton />
        </div>
      ) : null}

      {!busy && notes ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {notes}
        </p>
      ) : null}

      {!busy && gaps.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Wardrobe gaps
          </h4>
          <ul className="mt-1 list-inside list-disc text-sm text-stone-700">
            {gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!busy && outfits.length > 0 ? (
        <ul className="flex flex-col gap-6">
          {outfits.map((o, idx) => (
            <li
              key={`${o.title}-${idx}`}
              className="rounded-xl border border-stone-300/70 bg-stone-50 p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
            >
              <h4 className="font-serif text-lg font-semibold text-stone-900">
                {o.title}
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{o.rationale}</p>
              <div className="mt-4 -mx-1 overflow-x-auto px-1 pb-1">
                <div className="flex min-w-0 snap-x snap-mandatory gap-3">
                  {o.items.map((it) => (
                    <div
                      key={it.id}
                      className="w-[7.25rem] shrink-0 snap-start overflow-hidden rounded-xl border border-stone-100 bg-stone-50 shadow-sm"
                    >
                      <div className="aspect-[3/4] bg-stone-100">
                        {it.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={it.imageUrl}
                            alt={it.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-stone-400">
                            No photo
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        {it.brand ? (
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-stone-500">
                            {it.brand}
                          </p>
                        ) : null}
                        <p className="line-clamp-2 text-xs font-medium leading-tight text-stone-800">
                          {it.name}
                        </p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-stone-500">
                          {it.category}
                        </p>
                        {it.productUrl ? (
                          <a
                            href={it.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-[10px] font-medium text-rose-700 hover:underline"
                          >
                            Open link
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
