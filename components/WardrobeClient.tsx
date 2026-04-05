"use client";

import { signOut } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";
import type { ItemDTO } from "@/lib/types";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { filterWardrobe } from "@/lib/filter-items";
import { ItemCard } from "@/components/ItemCard";
import { ItemForm } from "@/components/ItemForm";
import { RetailerGrid } from "@/components/RetailerGrid";
import { SignInCard } from "@/components/SignInCard";
import { SuggestPanel } from "@/components/SuggestPanel";
import { StarterPieces } from "@/components/StarterPieces";
import { TabPanel } from "@/components/TabPanel";
import { Toast } from "@/components/Toast";

type Props = {
  initialItems: ItemDTO[];
  isAuthenticated: boolean;
  userEmail?: string;
};

type Tab = "discover" | "wardrobe" | "add" | "outfits";

export function WardrobeClient({
  initialItems,
  isAuthenticated,
  userEmail,
}: Props) {
  const [items, setItems] = useState<ItemDTO[]>(initialItems);
  const [editing, setEditing] = useState<ItemDTO | null>(null);
  const [tab, setTab] = useState<Tab>(() =>
    isAuthenticated ? "wardrobe" : "discover",
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [items],
  );

  const filtered = useMemo(
    () => filterWardrobe(sorted, search, categoryFilter),
    [sorted, search, categoryFilter],
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
    setToast({
      message: editing ? "Item updated." : "Saved to your wardrobe.",
      variant: "success",
    });
    setTab("wardrobe");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "discover", label: "Discover" },
    { id: "wardrobe", label: "Wardrobe" },
    { id: "add", label: editing ? "Edit item" : "Add item" },
    { id: "outfits", label: "Outfit ideas" },
  ];

  /** Section title (H1)—brand name lives only in the eyebrow above, like a logo + page title. */
  const sectionTitle =
    tab === "discover"
      ? "Discover"
      : tab === "wardrobe"
        ? "Wardrobe"
        : tab === "add"
          ? editing
            ? "Edit item"
            : "Add an item"
          : "Outfit ideas";

  const headerSubtitle =
    tab === "discover"
      ? "Browse real product shots and retailers—sign in when you want to save pieces or use AI outfit ideas."
      : tab === "wardrobe"
        ? "Your clothes, searchable."
        : tab === "add"
          ? "Paste a retailer link and use Load preview when it works; otherwise upload your own shot."
          : "Uses OpenAI with your saved item IDs—no invented pieces.";

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      ) : null}

      <div className="relative mb-10 w-full min-w-0 overflow-hidden rounded-2xl border border-stone-300/60 bg-stone-50 shadow-[0_1px_3px_rgba(28,25,23,0.06)]">
        {isAuthenticated ? (
          <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-0.5 sm:right-5 sm:top-4">
            {userEmail ? (
              <span className="max-w-[10rem] truncate text-[10px] text-stone-500 sm:max-w-[14rem]">
                {userEmail}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="text-[11px] font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setTab("wardrobe")}
            className="absolute right-3 top-3 z-10 text-[11px] font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline sm:right-5 sm:top-4"
          >
            Sign in
          </button>
        )}
        <header className="px-5 pb-5 pt-7 pr-20 sm:px-8 sm:pb-6 sm:pr-28 sm:pt-8">
          <div className="min-w-0 border-l-2 border-rose-300 pl-5 sm:pl-6">
            <p className="font-serif text-sm font-semibold tracking-tight text-stone-700">
              Fashion Agent
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-[2.25rem] sm:leading-tight">
              {sectionTitle}
            </h1>
            <p className="mt-2 min-h-[4.5rem] max-w-xl text-sm leading-relaxed text-stone-500">
              {headerSubtitle}
            </p>
          </div>
        </header>

        <nav
          className="sticky top-0 z-40 border-t border-stone-200/80 bg-stone-100/95 px-3 py-3 backdrop-blur-md sm:px-4"
          aria-label="Main"
        >
          <div
            className="-mx-1 flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden rounded-xl bg-stone-200/50 p-1 sm:mx-0 sm:inline-flex sm:max-w-none sm:overflow-visible sm:rounded-full"
            role="tablist"
            aria-orientation="horizontal"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                id={`tab-${t.id}`}
                className={`min-h-[44px] shrink-0 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 sm:rounded-full sm:px-5 ${
                  tab === t.id
                    ? "bg-stone-50 text-stone-900 shadow-sm ring-1 ring-stone-300/70"
                    : "text-stone-600 hover:bg-stone-50/80 hover:text-stone-900"
                }`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div
        className="w-full min-w-0 min-h-[min(58vh,36rem)]"
        aria-live="polite"
      >
      {tab === "discover" ? (
        <TabPanel>
          <div className="space-y-10">
            <section aria-labelledby="landing-examples">
              <h2
                id="landing-examples"
                className="mb-2 font-serif text-xl font-semibold text-stone-900"
              >
                Example pieces
              </h2>
              <p className="mb-6 max-w-2xl text-sm text-stone-600">
                Curated retailer pieces whose live photos load successfully. Four across on a wide
                screen. Tap <strong>Add to wardrobe</strong> to save.{" "}
                {!isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      className="font-semibold text-rose-800 underline-offset-2 hover:underline"
                      onClick={() => setTab("wardrobe")}
                    >
                      Sign in
                    </button>{" "}
                    first if you want items in your closet.
                  </>
                ) : (
                  "You can edit anything after it’s in your closet."
                )}
              </p>
              <StarterPieces
                layout="photoGrid"
                onUnauthorized={() => {
                  setToast({
                    message: "Sign in to add pieces to your wardrobe.",
                    variant: "error",
                  });
                  setTab("wardrobe");
                }}
                onAdded={(item) => {
                  setItems((prev) => [item, ...prev]);
                  setToast({
                    message: "Added to your wardrobe.",
                    variant: "success",
                  });
                }}
              />
            </section>

            <section
              className="border-t border-stone-200/80 pt-10"
              aria-labelledby="landing-retailers"
            >
              <h2
                id="landing-retailers"
                className="mb-6 font-serif text-xl font-semibold text-stone-900"
              >
                Shop more brands
              </h2>
              <RetailerGrid />
            </section>
          </div>
        </TabPanel>
      ) : null}

      {tab === "wardrobe" && !isAuthenticated ? (
        <TabPanel aria-labelledby="wardrobe-auth-heading">
          <h2 id="wardrobe-auth-heading" className="sr-only">
            Sign in to view wardrobe
          </h2>
          <div className="mx-auto max-w-md">
            <SignInCard
              variant="embedded"
              subtitle="Sign in to save items, browse your closet, and use AI outfit ideas."
            />
          </div>
        </TabPanel>
      ) : null}

      {tab === "wardrobe" && isAuthenticated ? (
        <TabPanel aria-labelledby="wardrobe-heading">
          <h2 id="wardrobe-heading" className="sr-only">
            Wardrobe inventory
          </h2>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300/90 bg-stone-100/40 p-6 sm:p-8">
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                Start your wardrobe
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
                Example pieces are men&apos;s <strong>UNIQLO US</strong> and <strong>J.Crew</strong>{" "}
                on the{" "}
                <button
                  type="button"
                  className="font-semibold text-rose-800 underline-offset-2 hover:underline"
                  onClick={() => setTab("discover")}
                >
                  Discover
                </button>{" "}
                tab—tap <strong>Add to wardrobe</strong> there, or use{" "}
                <strong>Add item</strong> to paste any product link.
              </p>
            </div>
          ) : null}

          {items.length > 0 ? (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-stone-500">
                  {filtered.length} of {items.length} piece
                  {items.length === 1 ? "" : "s"}
                  {categoryFilter !== "all" || search.trim()
                    ? " match filters"
                    : ""}
                </p>
                <label className="sr-only" htmlFor="wardrobe-search">
                  Search wardrobe
                </label>
                <input
                  id="wardrobe-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, colors, tags…"
                  className="w-full max-w-md rounded-full border border-stone-300/80 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none ring-rose-500/30 placeholder:text-stone-400 focus:ring-2 sm:w-72"
                />
              </div>

              <div
                className="mb-8 flex flex-wrap gap-2"
                role="group"
                aria-label="Filter by category"
              >
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 ${
                    categoryFilter === "all"
                      ? "bg-rose-700 text-white"
                      : "border border-stone-300/70 bg-stone-100/80 text-stone-600 hover:border-stone-400/80"
                  }`}
                >
                  All
                </button>
                {ITEM_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoryFilter(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 ${
                      categoryFilter === c
                        ? "bg-rose-700 text-white"
                        : "border border-stone-300/70 bg-stone-100/80 text-stone-600 hover:border-stone-400/80"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {items.length > 0 && filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300/90 bg-stone-100/50 px-6 py-16 text-center text-stone-600">
              <p className="font-medium text-stone-800">No matches</p>
              <p className="mt-2 text-sm">
                Try a different search or tap <strong>All</strong> to see everything.
              </p>
            </div>
          ) : null}

          {items.length > 0 && filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={(it) => {
                    setEditing(it);
                    setTab("add");
                  }}
                  onDeleted={(id) => {
                    setItems((prev) => prev.filter((x) => x.id !== id));
                    if (editing?.id === id) setEditing(null);
                    setToast({
                      message: "Removed from your wardrobe.",
                      variant: "success",
                    });
                  }}
                />
              ))}
            </div>
          ) : null}
        </TabPanel>
      ) : null}

      {tab === "add" && !isAuthenticated ? (
        <TabPanel aria-labelledby="add-auth-heading">
          <h2 id="add-auth-heading" className="sr-only">
            Sign in to add items
          </h2>
          <div className="mx-auto max-w-md">
            <SignInCard
              variant="embedded"
              subtitle="Sign in to add and edit pieces in your closet."
            />
          </div>
        </TabPanel>
      ) : null}

      {tab === "add" && isAuthenticated ? (
        <TabPanel aria-labelledby="add-heading">
          <h2 id="add-heading" className="sr-only">
            {editing ? "Edit item" : "Add an item"}
          </h2>
          <div className="mb-6 max-w-2xl">
            <p className="text-sm text-stone-600">
              Paste a retailer link or upload your own photo.
            </p>
          </div>
          <ItemForm
            editing={editing}
            onDone={handleDone}
            onCancelEdit={() => {
              setEditing(null);
              setTab("wardrobe");
            }}
            onToast={(message, variant) => setToast({ message, variant })}
          />
        </TabPanel>
      ) : null}

      {tab === "outfits" && !isAuthenticated ? (
        <TabPanel aria-labelledby="outfits-auth-heading">
          <h2 id="outfits-auth-heading" className="sr-only">
            Sign in for outfit ideas
          </h2>
          <div className="mx-auto max-w-md">
            <SignInCard
              variant="embedded"
              subtitle="Sign in to generate AI outfit ideas from your saved items (OpenAI)."
            />
          </div>
        </TabPanel>
      ) : null}

      {tab === "outfits" && isAuthenticated ? (
        <TabPanel aria-labelledby="outfits-heading">
          <h2 id="outfits-heading" className="sr-only">
            Outfit ideas
          </h2>
          <p className="mb-6 max-w-2xl text-sm text-stone-600">
            Uses OpenAI with your saved item IDs—no invented pieces.
          </p>
          <SuggestPanel hasItems={items.length > 0} />
        </TabPanel>
      ) : null}
      </div>
    </div>
  );
}
