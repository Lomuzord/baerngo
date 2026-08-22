"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { SehenswuerdigkeitKarte } from "@/lib/katalog"
import { fotoFuerSehenswuerdigkeit } from "@/lib/fotos"
import { meshFuerSehenswuerdigkeit } from "@/lib/modelle"
import { entfernungText, istInReichweite } from "@/lib/reichweite"
import { modellAlsBild } from "./modellBild"
import type { SpielerOrt } from "./useSpielerOrt"

export function OrtVorschauPanel({
  eintrag,
  spieler,
  onSchliessen,
}: {
  eintrag: SehenswuerdigkeitKarte
  spieler: SpielerOrt
  onSchliessen: () => void
}) {
  const foto = fotoFuerSehenswuerdigkeit(eintrag.id)
  const mesh = meshFuerSehenswuerdigkeit(eintrag.id)
  const reichweite =
    spieler.status === "bereit"
      ? istInReichweite(spieler.lage, eintrag.id)
      : null
  // Das Voxel-Bauwerk frontal als Vorschaubild
  const [modellBild, setModellBild] = useState<string | null>(null)
  useEffect(() => {
    setModellBild(null)
    if (!mesh) return
    let aktiv = true
    void modellAlsBild(mesh, -0.15)
      .then((bild) => {
        if (aktiv) setModellBild(bild)
      })
      .catch(() => {})
    return () => {
      aktiv = false
    }
    // mesh folgt aus eintrag.id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eintrag.id])

  return (
    <aside className="mc-ort-karte" aria-label={eintrag.name}>
      <div className="mc-ort-karte-zeile">
        <div className="mc-ort-karte-text">
          <p className="mc-kicker">Ort</p>
          <h2 className="mc-ort-karte-titel">{eintrag.name}</h2>
          <p className="mc-ort-karte-distanz">
            {reichweite
              ? entfernungText(reichweite.distanzMeter)
              : spieler.status === "verweigert"
                ? "Standort blockiert"
                : "Suche Standort…"}
          </p>
          <Link
            href={`/sehenswuerdigkeiten/${eintrag.id}`}
            className="mc-btn mc-ort-karte-link"
          >
            Zum Quiz
          </Link>
        </div>
        {modellBild ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="mc-ort-karte-foto mc-ort-karte-modell"
            src={modellBild}
            alt={eintrag.name}
            width={120}
            height={120}
          />
        ) : foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="mc-ort-karte-foto"
            src={foto.src}
            alt={eintrag.name}
            width={120}
            height={120}
          />
        ) : null}
      </div>
      <button
        type="button"
        className="mc-ort-karte-zu"
        onClick={onSchliessen}
        aria-label="Karte schliessen"
      >
        Schliessen
      </button>
    </aside>
  )
}
