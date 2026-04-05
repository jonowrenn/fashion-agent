import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
};

/**
 * Shared shell for main tab content so Discover, Wardrobe, Add, Outfits, and sign-in
 * all sit in the same visual frame.
 */
export function TabPanel({ children, className = "", id, "aria-labelledby": labelledBy }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`w-full min-w-0 rounded-2xl border border-stone-300/60 bg-stone-50 p-6 shadow-[0_1px_3px_rgba(28,25,23,0.05)] sm:p-8 ${className}`}
    >
      {children}
    </section>
  );
}
