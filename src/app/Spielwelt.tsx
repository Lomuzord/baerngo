"use client"

import type { SehenswuerdigkeitKarte } from "@/lib/katalog"
import { BernKarte } from "./BernKarte"
import { InventarLeiste } from "./InventarLeiste"
import { SehenswuerdigkeitenList } from "./SehenswuerdigkeitenList"
import { useInventar } from "./useInventar"

export function Spielwelt({
  sehenswuerdigkeiten,
}: {
  sehenswuerdigkeiten: SehenswuerdigkeitKarte[]
}) {
  const { inventar } = useInventar()

  return (
    <main className="mc-world">
      <header className="mc-header">
        <p className="mc-kicker">Bern</p>
        <h1 className="mc-title">bärngo</h1>
        <p className="mc-tagline">Geh hin. Quiz. Sammle Blöcke.</p>
        <InventarLeiste inventar={inventar} />
      </header>
      <BernKarte sehenswuerdigkeiten={sehenswuerdigkeiten} />
      <SehenswuerdigkeitenList sehenswuerdigkeiten={sehenswuerdigkeiten} />
    </main>
  )
}
