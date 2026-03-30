"use client";

import { useMemo, useState } from "react";
import type { ItemDTO } from "@/lib/types";
import { ItemCard } from "@/components/ItemCard";
import { ItemForm } from "@/components/ItemForm";
import { SuggestPanel } from "@/components/SuggestPanel";

type Props = {
  initialItems: ItemDTO[];
};

export function WardrobeClient({ initialItems }: Props) {
  const [items, setItems] = useState<ItemDTO[]>(initialItems);
  const [editing, setEditing] = useState<ItemDTO | null>(null);

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [items],
  );

  function handleDone(item: ItemDTO) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });
    setEditing(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
      <header className="mb-12 border-b border-stone-200 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
          Fashion agent
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Your wardrobe
        </h1>
        <p className="mt-3 max-w-xl text-lg text-stone-600">
          Log what you own with photos and links, then ask for outfits and honest
          gap checks—grounded in your real inventory.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-stone-900">
            {editing ? "Edit item" : "Add an item"}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Paste a retailer link and use Load preview when it works; otherwise
            upload your own shot.
          </p>
          <div className="mt-6">
            <ItemForm
              editing={editing}
              onDone={handleDone}
              onCancelEdit={() => setEditing(null)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-stone-900">
            Outfit ideas
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Uses OpenAI with your saved item IDs—no invented pieces.
          </p>
          <div className="mt-6">
            <SuggestPanel hasItems={items.length > 0} />
          </div>
        </section>
      </div>

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Inventory
            </h2>
            <p className="text-sm text-stone-500">
              {items.length} piece{items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 px-6 py-16 text-center text-stone-600">
            Nothing here yet—add your first item above.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={(it) => {
                  setEditing(it);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDeleted={(id) => {
                  setItems((prev) => prev.filter((x) => x.id !== id));
                  if (editing?.id === id) setEditing(null);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
