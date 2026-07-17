"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const aktiv = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
        aktiv
          ? "bg-white/15 text-white font-medium"
          : "text-teal-100 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </Link>
  );
}
