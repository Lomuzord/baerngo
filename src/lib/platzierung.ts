import { listSehenswuerdigkeiten, type Lage } from "./katalog"
import { ressourceFuerSehenswuerdigkeit } from "./sammeln"

export type SichtModell = {
  id: string
  name: string
  alias: string[]
  lage: Lage
  modellId: string
  textur: string
}

export function listSichtModelle(): SichtModell[] {
  return listSehenswuerdigkeiten().map((eintrag) => {
    const ressource = ressourceFuerSehenswuerdigkeit(eintrag.id)
    return {
      id: eintrag.id,
      name: eintrag.name,
      alias: eintrag.alias,
      lage: eintrag.lage,
      modellId: `mc-block-${eintrag.id}`,
      textur: ressource?.textur ?? "/bloecke/erde.png",
    }
  })
}

export function sichtModellById(id: string): SichtModell | undefined {
  return listSichtModelle().find((modell) => modell.id === id)
}
