"use client"

import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { SehenswuerdigkeitKarte } from "@/lib/katalog"
import { schalteTon, tonAn } from "@/lib/klang"
import { starteMusik, stoppeMusik } from "@/lib/musik"
import { OrtVorschauPanel } from "./OrtVorschauPanel"
import { SehenswuerdigkeitenList } from "./SehenswuerdigkeitenList"
import { SpielerOrtProvider, useSpielerOrt } from "./useSpielerOrt"

const INTRO_SPEICHER = "baerngo-intro-gesehen"

const BernKarteGl = dynamic(
  () => import("./BernKarteGl").then((modul) => modul.BernKarteGl),
  { ssr: false, loading: () => <div className="mc-map3d" /> },
)

export function Spielwelt({
  sehenswuerdigkeiten,
}: {
  sehenswuerdigkeiten: SehenswuerdigkeitKarte[]
}) {
  const suche = useSearchParams()
  const router = useRouter()
  const spieler = useSpielerOrt()
  const [ton, setTon] = useState(true)
  const [introOffen, setIntroOffen] = useState(false)

  useEffect(() => {
    setTon(tonAn())
    setIntroOffen(window.localStorage.getItem(INTRO_SPEICHER) !== "1")
  }, [])

  function schliesseIntro() {
    window.localStorage.setItem(INTRO_SPEICHER, "1")
    setIntroOffen(false)
  }

  const gewaehltId = suche.get("ort")
  const gewaehlt =
    sehenswuerdigkeiten.find((eintrag) => eintrag.id === gewaehltId) ?? null
  const spielerLage = spieler.status === "bereit" ? spieler.lage : null

  function waehleOrt(id: string | null) {
    const params = new URLSearchParams(suche.toString())
    if (id) params.set("ort", id)
    else params.delete("ort")
    const qs = params.toString()
    router.replace(qs ? `/?${qs}` : "/", { scroll: false })
  }

  return (
    <SpielerOrtProvider wert={spieler}>
      <main className="mc-world">
        <header className="mc-header">
          <h1 className="mc-title">bärngo</h1>
          <button
            type="button"
            className="mc-ton-btn"
            aria-pressed={ton}
            aria-label={ton ? "Ton ausschalten" : "Ton einschalten"}
            onClick={() => {
              const an = schalteTon()
              setTon(an)
              if (an) starteMusik()
              else stoppeMusik()
            }}
          >
            {ton ? "🔊" : "🔇"}
          </button>
        </header>
        {introOffen ? (
          <div className="mc-intro" role="dialog" aria-label="So funktioniert bärngo">
            <p className="mc-intro-zeile">🚶 Lauf zu den Blöcken auf der Karte</p>
            <p className="mc-intro-zeile">👆 Tippe sie im blauen Ring an</p>
            <p className="mc-intro-zeile">🏛️ Löse Quizze an Sehenswürdigkeiten für Truhen</p>
            <p className="mc-intro-zeile">⛏️ Baue mit deiner Beute unter „Bauen“</p>
            <button type="button" className="mc-btn" onClick={schliesseIntro}>
              Los geht’s
            </button>
          </div>
        ) : null}
        <div className="mc-map-wrap">
          <BernKarteGl
            gewaehltId={gewaehlt?.id ?? null}
            onWaehle={waehleOrt}
          />
          {gewaehlt ? (
            <OrtVorschauPanel
              key={gewaehlt.id}
              eintrag={gewaehlt}
              spieler={spieler}
              onSchliessen={() => waehleOrt(null)}
            />
          ) : null}
        </div>
        <SehenswuerdigkeitenList
          sehenswuerdigkeiten={sehenswuerdigkeiten}
          spielerLage={spielerLage}
          gewaehltId={gewaehlt?.id ?? null}
          onWaehle={waehleOrt}
        />
      </main>
    </SpielerOrtProvider>
  )
}
