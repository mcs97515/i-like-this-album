"use client";

import { usePathname } from "next/navigation";

export function PageTransition({
  children,
  className = "flex w-full flex-col items-center gap-8",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={`animate-fade-in-down ${className}`}>
      {children}
    </div>
  );
}
