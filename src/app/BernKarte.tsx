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
    <div className="mc-map">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/api/karte"
        alt="Minecraft-artige Mapbox-Karte von Bern"
        width={BERN_KARTE.width}
        height={BERN_KARTE.height}
        data-testid="mapbox-karte"
      />

      {sehenswuerdigkeiten.map((eintrag) => {
        const pixel = pixelFuerLage(eintrag.lage, BERN_KARTE)
        if (!liegtAufKarte(pixel, BERN_KARTE)) return null
        return (
          <Link
            key={eintrag.id}
            href={`/sehenswuerdigkeiten/${eintrag.id}`}
            className="mc-pin"
            style={{
              left: `${(pixel.x / BERN_KARTE.width) * 100}%`,
              top: `${(pixel.y / BERN_KARTE.height) * 100}%`,
            }}
            aria-label={eintrag.name}
          >
            <span className="sr-only">{eintrag.name}</span>
          </Link>
        )
      })}

      {spielerPixel && liegtAufKarte(spielerPixel, BERN_KARTE) ? (
        <span
          className="mc-player"
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
