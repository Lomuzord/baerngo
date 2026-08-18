import type { SehenswuerdigkeitKarte } from "@/lib/katalog"
import { SehenswuerdigkeitKarte3D } from "./SehenswuerdigkeitKarte3D"

export function SehenswuerdigkeitenList({
  sehenswuerdigkeiten,
}: {
  sehenswuerdigkeiten: SehenswuerdigkeitKarte[]
}) {
  return (
    <ul className="mc-card-grid">
      {sehenswuerdigkeiten.map((eintrag) => (
        <li key={eintrag.id}>
          <SehenswuerdigkeitKarte3D eintrag={eintrag} />
        </li>
      ))}
    </ul>
  )
}
