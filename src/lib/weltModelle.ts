import { listSehenswuerdigkeiten, type Lage } from "./katalog"
import { meshFuerSehenswuerdigkeit, type SichtMesh } from "./modelle"

export type WeltModell = {
  id: string
  lage: Lage
  mesh: SichtMesh
  hoeheMeter: number
  lochMeter: number
}

const GROESSE: Record<string, { hoeheMeter: number; lochMeter: number }> = {
  baerengraben: { hoeheMeter: 28, lochMeter: 55 },
  bundeshaus: { hoeheMeter: 62, lochMeter: 90 },
}

export function listWeltModelle(): WeltModell[] {
  const liste: WeltModell[] = []
  for (const eintrag of listSehenswuerdigkeiten()) {
    const mesh = meshFuerSehenswuerdigkeit(eintrag.id)
    const groesse = GROESSE[eintrag.id]
    if (!mesh || !groesse) continue
    liste.push({
      id: eintrag.id,
      lage: eintrag.lage,
      mesh,
      hoeheMeter: groesse.hoeheMeter,
      lochMeter: groesse.lochMeter,
    })
  }
  return liste
}

export function trefferWeltModell(
  punkt: { x: number; y: number },
  projektion: (lngLat: [number, number]) => { x: number; y: number },
  modelle: WeltModell[] = listWeltModelle(),
): string | null {
  for (const modell of modelle) {
    const mitte = projektion([modell.lage.lng, modell.lage.lat])
    const rand = projektion([
      modell.lage.lng,
      modell.lage.lat + modell.hoeheMeter / 111_320,
    ])
    const radius = Math.max(
      48,
      Math.hypot(rand.x - mitte.x, rand.y - mitte.y) * 0.75,
    )
    if (Math.hypot(punkt.x - mitte.x, punkt.y - mitte.y) <= radius) {
      return modell.id
    }
  }
  return null
}
