"use client";

import { useEffect } from "react";

type Props = {
  message: string;
  variant: "success" | "error";
  onDismiss: () => void;
};

export function Toast({ message, variant, onDismiss }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(t);
  }, [message, onDismiss]);

  const styles =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-red-200 bg-red-50 text-red-950";

  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${styles}`}
    >
      {message}
    </div>
  );
}
