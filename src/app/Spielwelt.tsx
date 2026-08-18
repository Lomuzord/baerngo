"use client"

import dynamic from "next/dynamic"
import type { SehenswuerdigkeitKarte } from "@/lib/katalog"
import { SehenswuerdigkeitenList } from "./SehenswuerdigkeitenList"

const BernWelt3D = dynamic(
  () => import("./BernWelt3D").then((modul) => modul.BernWelt3D),
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
      <BernWelt3D sehenswuerdigkeiten={sehenswuerdigkeiten} />
      <SehenswuerdigkeitenList sehenswuerdigkeiten={sehenswuerdigkeiten} />
    </main>
  )
}
