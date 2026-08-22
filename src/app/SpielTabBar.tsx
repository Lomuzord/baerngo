"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/", label: "Karte" },
  { href: "/inventar", label: "Inventar" },
  { href: "/werkbank", label: "Werkbank" },
  { href: "/bauen", label: "Bauen" },
] as const

export function SpielTabBar() {
  const pfad = usePathname()

  return (
    <nav className="mc-tabs" aria-label="Spiel">
      {TABS.map((tab) => {
        const aktiv =
          tab.href === "/"
            ? pfad === "/"
            : pfad.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={aktiv ? "mc-tab mc-tab-aktiv" : "mc-tab"}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
