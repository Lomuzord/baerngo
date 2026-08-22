"use client"

import { useEffect } from "react"
import { haptikArtVonZiel, spieleHaptik } from "@/lib/haptik"
import { starteMusik } from "@/lib/musik"

export function HaptikLauscher() {
  useEffect(() => {
    function aufZeiger(event: PointerEvent) {
      if (event.pointerType === "mouse" && event.button !== 0) return
      // Musik darf erst nach einer Nutzergeste starten (Autoplay-Regeln)
      starteMusik()
      const art = haptikArtVonZiel(event.target)
      if (art) spieleHaptik(art)
    }
    document.addEventListener("pointerdown", aufZeiger, { passive: true })
    return () => document.removeEventListener("pointerdown", aufZeiger)
  }, [])
  return null
}
