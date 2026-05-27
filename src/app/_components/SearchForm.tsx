"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";

export function SearchForm({ initialQuery }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    startTransition(() => {
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <>
      {pending && createPortal(
        <div className="fixed top-0 left-0 right-0 z-50 h-1 overflow-hidden">
          <div className="h-full bg-blue-500 animate-progress" />
        </div>,
        document.body
      )}
      <form onSubmit={onSubmit} className="flex gap-4 w-full max-w-xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter an album name..."
          className="flex-1 rounded border border-gray-700 px-4 py-2"
        />
        <button
          type="submit"
          disabled={pending || !query.trim()}
          className="rounded-full bg-gray-900 px-6 py-2 text-white disabled:opacity-50 transition-all duration-150 hover:scale-105 hover:bg-white hover:text-gray-900"
        >
          Search
        </button>
      </form>
    </>
  );
}
