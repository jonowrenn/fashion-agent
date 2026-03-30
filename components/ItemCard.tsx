"use client";

import type { ItemDTO } from "@/lib/types";

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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[4/5] bg-stone-100">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">
            No photo
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="font-serif text-lg font-semibold leading-snug text-stone-900">
            {item.name}
          </h3>
          <p className="text-xs uppercase tracking-wide text-stone-500">
            {item.category}
            {item.formality ? ` · ${item.formality}` : ""}
          </p>
        </div>
        {item.colors ? (
          <p className="text-sm text-stone-600">{item.colors}</p>
        ) : null}
        {item.productUrl ? (
          <a
            href={item.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-medium text-rose-700 underline-offset-2 hover:underline"
          >
            View product page
          </a>
        ) : null}
        <div className="mt-auto flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
