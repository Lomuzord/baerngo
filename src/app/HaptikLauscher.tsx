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
    // Langes Drücken ist bei uns eine Spielgeste (Stapel ablegen,
    // Abbauen). Das native Bild-Menü "Bild kopieren / herunterladen"
    // darf dabei nicht aufgehen.
    function aufKontext(event: MouseEvent) {
      const ziel = event.target
      if (!(ziel instanceof Element)) return
      if (
        ziel.closest(
          ".mc-slot, [data-craft-slot], .mc-hotbar, .mc-hotbar-raster, .mc-inv-fenster, .mc-lager, .mc-werkbank-fenster, .mc-platte-canvas, .mc-ar-canvas, .mc-map3d, .mc-truhe-btn, .mc-wild, .mc-pokestop, .mc-hand-ablage",
        )
      ) {
        event.preventDefault()
      }
    }
    document.addEventListener("pointerdown", aufZeiger, { passive: true })
    document.addEventListener("contextmenu", aufKontext)
    return () => {
      document.removeEventListener("pointerdown", aufZeiger)
      document.removeEventListener("contextmenu", aufKontext)
    }
  }, [])
  return null
}
