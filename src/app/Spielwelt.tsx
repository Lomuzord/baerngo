"use client"

import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import type { SehenswuerdigkeitKarte } from "@/lib/katalog"
import { OrtVorschauPanel } from "./OrtVorschauPanel"
import { SehenswuerdigkeitenList } from "./SehenswuerdigkeitenList"
import { useSpielerOrt } from "./useSpielerOrt"

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
    <main className="mc-world">
      <header className="mc-header">
        <p className="mc-kicker">Bern</p>
        <h1 className="mc-title">bärngo</h1>
        <p className="mc-tagline">Geh hin. Quiz. Öffne die Truhe.</p>
      </header>
      <div className="mc-map-wrap">
        <BernKarteGl
          gewaehltId={gewaehlt?.id ?? null}
          onWaehle={waehleOrt}
        />
        {gewaehlt ? (
          <OrtVorschauPanel
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
  )
}
