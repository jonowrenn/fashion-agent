"use client";

import type { ItemDTO } from "@/lib/types";

function formatCategory(cat: string): string {
  return cat
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = {
  item: ItemDTO;
  onEdit: (item: ItemDTO) => void;
  onDeleted: (id: string) => void;
};

export function ItemCard({ item, onEdit, onDeleted }: Props) {
  async function remove() {
    if (!confirm(`Remove “${item.name}” from your wardrobe?`)) return;
    const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(item.id);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-stone-300/70 bg-stone-50 shadow-sm transition hover:border-stone-400/70 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-stone-100 to-stone-200/90">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="flex h-full flex-col items-center justify-center gap-1 p-2 text-stone-400"
            aria-hidden
          >
            <svg
              className="h-8 w-8 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[10px] font-medium">Photo</span>
          </div>
        )}
        <div className="pointer-events-none absolute left-1.5 top-1.5 flex flex-wrap gap-0.5">
          <span className="rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {formatCategory(item.category)}
          </span>
        </div>
        <div className="absolute inset-0 flex items-end justify-center gap-1.5 bg-gradient-to-t from-black/60 via-black/15 to-transparent p-2 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="pointer-events-auto rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-900 shadow-md hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            className="pointer-events-auto rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-red-700 shadow-md hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1 border-t border-stone-200/80 p-2">
        {item.brand ? (
          <p className="text-[9px] font-semibold uppercase tracking-wide text-stone-500">
            {item.brand}
          </p>
        ) : null}
        <h3 className="line-clamp-2 font-serif text-xs font-semibold leading-tight text-stone-900">
          {item.name}
        </h3>
        <div className="flex items-center justify-between gap-1">
          {item.productUrl ? (
            <a
              href={item.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-rose-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
              title="Open product link"
            >
              <span className="sr-only">Product link</span>
              <span aria-hidden>↗</span>
            </a>
          ) : (
            <span />
          )}
          <div className="flex gap-1 md:hidden">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded border border-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => void remove()}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
