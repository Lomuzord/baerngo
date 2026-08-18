import type { Lage, SehenswuerdigkeitKarte } from "@/lib/katalog"
import { SehenswuerdigkeitKarte3D } from "./SehenswuerdigkeitKarte3D"

export function SehenswuerdigkeitenList({
  sehenswuerdigkeiten,
  spielerLage,
  gewaehltId,
  onWaehle,
}: {
  sehenswuerdigkeiten: SehenswuerdigkeitKarte[]
  spielerLage: Lage | null
  gewaehltId: string | null
  onWaehle: (id: string) => void
}) {
  return (
    <ul className="mc-card-grid">
      {sehenswuerdigkeiten.map((eintrag) => (
        <li key={eintrag.id}>
          <SehenswuerdigkeitKarte3D
            eintrag={eintrag}
            spielerLage={spielerLage}
            gewaehlt={eintrag.id === gewaehltId}
            onWaehle={onWaehle}
          />
        </li>
      ))}
    </ul>
  )
}
