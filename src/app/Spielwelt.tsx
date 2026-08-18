"use client"

import dynamic from "next/dynamic"
import type { SehenswuerdigkeitKarte } from "@/lib/katalog"
import { SehenswuerdigkeitenList } from "./SehenswuerdigkeitenList"

const BernKarteGl = dynamic(
  () => import("./BernKarteGl").then((modul) => modul.BernKarteGl),
  { ssr: false, loading: () => <div className="mc-map3d" /> },
)

export function Spielwelt({
  sehenswuerdigkeiten,
}: {
  sehenswuerdigkeiten: SehenswuerdigkeitKarte[]
}) {
  return (
    <main className="mc-world">
      <header className="mc-header">
        <p className="mc-kicker">Bern</p>
        <h1 className="mc-title">bärngo</h1>
        <p className="mc-tagline">Geh hin. Quiz. Sammle Blöcke.</p>
      </header>
      <BernKarteGl />
      <SehenswuerdigkeitenList sehenswuerdigkeiten={sehenswuerdigkeiten} />
    </main>
  )
}
