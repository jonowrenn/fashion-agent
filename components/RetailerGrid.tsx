import { RETAILERS } from "@/lib/retailers";

export function RetailerGrid() {
  const sorted = [...RETAILERS].sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  );

  return (
    <ul className="overflow-hidden rounded-xl border border-stone-200/90 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      {sorted.map((r, idx) => (
        <li
          key={r.id}
          className={idx > 0 ? "border-t border-stone-200/80" : ""}
        >
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-1 px-4 py-3.5 transition hover:bg-stone-50/90 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:py-3.5"
          >
            <div className="min-w-0 flex-1">
              <span className="font-serif text-base font-semibold text-stone-900 group-hover:text-rose-900">
                {r.name}
              </span>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{r.tagline}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-rose-800/90 group-hover:underline sm:pt-0.5">
              Open site →
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
