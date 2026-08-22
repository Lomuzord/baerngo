"use client"

import { useEffect, useState } from "react"
import { tagesTint, wetterArt, type Wetterart } from "@/lib/himmel"

// Legt echte Tageszeit und echtes Berner Wetter über die Karte:
// Nacht/Abendrot-Tönung nach Uhrzeit, Regen/Schnee von Open-Meteo.
export function WetterHimmel() {
  const [tint, setTint] = useState(() => tagesTint(neueStunde()))
  const [wetter, setWetter] = useState<Wetterart>("klar")

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTint(tagesTint(neueStunde()))
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let aktiv = true
    async function lade() {
      try {
        const antwort = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=46.95&longitude=7.45&current=weather_code",
        )
        const daten = (await antwort.json()) as {
          current?: { weather_code?: number }
        }
        if (aktiv) {
          setWetter(wetterArt(daten.current?.weather_code ?? Number.NaN))
        }
      } catch {
        // Ohne Wetterdienst bleibt es einfach klar
      }
    }
    void lade()
    const timer = window.setInterval(() => void lade(), 15 * 60_000)
    return () => {
      aktiv = false
      window.clearInterval(timer)
    }
  }, [])

  return (
    <>
      {tint.staerke > 0 ? (
        <div
          className="mc-himmel-tint"
          style={{ background: tint.farbe, opacity: tint.staerke }}
          aria-hidden
        />
      ) : null}
      {wetter === "regen" ? (
        <div className="mc-himmel-regen" aria-hidden />
      ) : null}
      {wetter === "schnee" ? (
        <div className="mc-himmel-schnee" aria-hidden />
      ) : null}
    </>
  )
}

function neueStunde(): number {
  const jetzt = new Date()
  return jetzt.getHours() + jetzt.getMinutes() / 60
}
