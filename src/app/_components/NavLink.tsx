"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink() {
  const pathname = usePathname();
  const onHistory = pathname === "/history";

  return (
    <Link
      href={onHistory ? "/" : "/history"}
      className="flex items-center gap-1.5 rounded-full border border-white bg-white px-4 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-100"
    >
      {onHistory ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Search
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          History
        </>
      )}
    </Link>
  );
}
