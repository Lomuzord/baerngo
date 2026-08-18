"use client"

import Link from "next/link"
import { BERN_KARTE, liegtAufKarte, pixelFuerLage } from "@/lib/karte"
import type { SehenswuerdigkeitKarte } from "@/lib/katalog"
import { useSpielerOrt } from "./useSpielerOrt"

type BernKarteProps = {
  sehenswuerdigkeiten: SehenswuerdigkeitKarte[]
}

export function BernKarte({ sehenswuerdigkeiten }: BernKarteProps) {
  const spieler = useSpielerOrt()
  const spielerPixel =
    spieler.status === "bereit"
      ? pixelFuerLage(spieler.lage, BERN_KARTE)
      : null

  return (
    <div className="relative min-h-[70vh] w-full overflow-hidden bg-stone-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/api/karte"
        alt="Mapbox-Karte der Berner Altstadt mit Sehenswürdigkeiten"
        width={BERN_KARTE.width}
        height={BERN_KARTE.height}
        className="h-full min-h-[70vh] w-full object-cover"
        data-testid="mapbox-karte"
      />

      {sehenswuerdigkeiten.map((eintrag) => {
        const pixel = pixelFuerLage(eintrag.lage, BERN_KARTE)
        if (!liegtAufKarte(pixel, BERN_KARTE)) return null
        return (
          <Link
            key={eintrag.id}
            href={`/sehenswuerdigkeiten/${eintrag.id}`}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(pixel.x / BERN_KARTE.width) * 100}%`,
              top: `${(pixel.y / BERN_KARTE.height) * 100}%`,
            }}
            aria-label={eintrag.name}
          >
            <span className="block h-0 w-0 border-x-[10px] border-t-[18px] border-x-transparent border-t-red-700 drop-shadow-md" />
            <span className="sr-only">{eintrag.name}</span>
          </Link>
        )
      })}

      {spielerPixel && liegtAufKarte(spielerPixel, BERN_KARTE) ? (
        <span
          className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400 ring-4 ring-sky-400/40"
          style={{
            left: `${(spielerPixel.x / BERN_KARTE.width) * 100}%`,
            top: `${(spielerPixel.y / BERN_KARTE.height) * 100}%`,
          }}
          aria-label="Dein Standort"
        />
      ) : null}
    </div>
  )
}
