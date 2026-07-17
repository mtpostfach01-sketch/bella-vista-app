"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface Tab {
  href: string;
  label: string;
  icon: string;
}

const MAX_DIREKT = 5;

export function BottomNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  const [mehrOffen, setMehrOffen] = useState(false);

  const [vorherigerPfad, setVorherigerPfad] = useState(pathname);
  if (pathname !== vorherigerPfad) {
    setVorherigerPfad(pathname);
    setMehrOffen(false);
  }

  const istAktiv = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Passen alle Ziele bequem in eine Reihe (z. B. BEDIENUNG mit 5 Zielen),
  // werden sie direkt gezeigt. Sonst: die ersten paar direkt + Rest im
  // Dropdown, damit keine Reihe gequetscht aussieht.
  const direkt = tabs.length <= MAX_DIREKT ? tabs : tabs.slice(0, MAX_DIREKT - 1);
  const imDropdown = tabs.length <= MAX_DIREKT ? [] : tabs.slice(MAX_DIREKT - 1);

  return (
    <div className="md:hidden">
      {mehrOffen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setMehrOffen(false)}
          />
          <div className="fixed bottom-16 right-2 z-40 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 min-w-[10rem]">
            {imDropdown.map((tab) => {
              const aktiv = istAktiv(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm ${
                    aktiv ? "text-gray-900 font-medium bg-gray-50" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {direkt.map((tab) => {
          const aktiv = istAktiv(tab.href) && !mehrOffen;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
                aktiv ? "text-gray-900 font-medium" : "text-gray-400"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
        {imDropdown.length > 0 && (
          <button
            onClick={() => setMehrOffen((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
              mehrOffen || imDropdown.some((t) => istAktiv(t.href))
                ? "text-gray-900 font-medium"
                : "text-gray-400"
            }`}
          >
            <span className="text-xl leading-none">{mehrOffen ? "✕" : "⋯"}</span>
            Mehr
          </button>
        )}
      </nav>
    </div>
  );
}
