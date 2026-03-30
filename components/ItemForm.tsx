"use client";

import { useEffect, useState } from "react";
import type { ItemDTO } from "@/lib/types";
import { FORMALITY_OPTIONS, ITEM_CATEGORIES } from "@/lib/constants";

type Props = {
  editing: ItemDTO | null;
  onDone: (item: ItemDTO) => void;
  onCancelEdit: () => void;
};

export function ItemForm({ editing, onDone, onCancelEdit }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(ITEM_CATEGORIES[0]);
  const [colors, setColors] = useState("");
  const [seasons, setSeasons] = useState("");
  const [tags, setTags] = useState("");
  const [formality, setFormality] = useState("");
  const [notes, setNotes] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [resolveMsg, setResolveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setColors(editing.colors);
      setSeasons(editing.seasons);
      setTags(editing.tags);
      setFormality(editing.formality ?? "");
      setNotes(editing.notes ?? "");
      setProductUrl(editing.productUrl ?? "");
      setImageUrl(editing.imageUrl ?? "");
      setFile(null);
    } else {
      setName("");
      setCategory(ITEM_CATEGORIES[0]);
      setColors("");
      setSeasons("");
      setTags("");
      setFormality("");
      setNotes("");
      setProductUrl("");
      setImageUrl("");
      setFile(null);
    }
    setResolveMsg(null);
  }, [editing]);

  async function resolveProductUrl() {
    if (!productUrl.trim()) {
      setResolveMsg("Paste a product link first.");
      return;
    }
    setBusy(true);
    setResolveMsg(null);
    try {
      const res = await fetch("/api/resolve-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl.trim() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        title?: string | null;
        imageUrl?: string | null;
        hint?: string;
        error?: string;
      };
      if (data.imageUrl) setImageUrl(data.imageUrl);
      if (data.title && !name.trim()) setName(data.title);
      setResolveMsg(
        data.imageUrl
          ? "Loaded preview image from the page."
          : data.hint ?? data.error ?? "No preview image found; upload a photo instead.",
      );
    } catch {
      setResolveMsg("Could not fetch that URL.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("category", category);
      fd.set("colors", colors);
      fd.set("seasons", seasons);
      fd.set("tags", tags);
      if (formality) fd.set("formality", formality);
      if (notes) fd.set("notes", notes);
      if (productUrl.trim()) fd.set("productUrl", productUrl.trim());
      if (imageUrl.trim()) fd.set("imageUrl", imageUrl.trim());
      if (file) fd.set("image", file);

      const url = editing ? `/api/items/${editing.id}` : "/api/items";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      const json = (await res.json()) as { item?: ItemDTO; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      if (json.item) onDone(json.item);
      if (!editing) {
        setName("");
        setCategory(ITEM_CATEGORIES[0]);
        setColors("");
        setSeasons("");
        setTags("");
        setFormality("");
        setNotes("");
        setProductUrl("");
        setImageUrl("");
        setFile(null);
      }
    } catch (err) {
      setResolveMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const label = editing ? "Update item" : "Add to wardrobe";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
            placeholder="e.g. Navy wool blazer"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
          >
            {ITEM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Colors
          <input
            value={colors}
            onChange={(e) => setColors(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
            placeholder="navy, cream"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Seasons
          <input
            value={seasons}
            onChange={(e) => setSeasons(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
            placeholder="fall, winter"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Formality
          <select
            value={formality}
            onChange={(e) => setFormality(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
          >
            <option value="">—</option>
            {FORMALITY_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f.replace("-", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
          Tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
            placeholder="work, weekend"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-y rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
          placeholder="Fit, fabric, how you like to wear it…"
        />
      </label>

      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Product link & photo
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-stone-700">
            Retailer product URL
            <input
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              type="url"
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
              placeholder="https://…"
            />
          </label>
          <button
            type="button"
            onClick={() => void resolveProductUrl()}
            disabled={busy}
            className="shrink-0 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
          >
            Load preview
          </button>
        </div>
        {resolveMsg ? (
          <p className="mt-2 text-sm text-stone-600">{resolveMsg}</p>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
            Image URL (optional)
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-rose-500/30 focus:ring-2"
              placeholder="Filled by Load preview or paste directly"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
            Upload file
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-stone-600 file:mr-2 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-rose-900"
            />
          </label>
        </div>
        {imageUrl ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="max-h-48 w-full object-contain"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-800 disabled:opacity-50"
        >
          {busy ? "Saving…" : label}
        </button>
        {editing ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Cancel edit
          </button>
        ) : null}
      </div>
    </form>
  );
}
