import type { ArLage } from "./bauen"

export const BLOCK_KANTE_METER = 0.16
export const EBENE_RADIUS_ZELLEN = 5

export type Ebene = {
  ursprung: ArLage
}

export function rasterAufEbene(punkt: ArLage, ebene: Ebene): ArLage {
  const k = BLOCK_KANTE_METER
  const ix = Math.round((punkt.x - ebene.ursprung.x) / k)
  const iz = Math.round((punkt.z - ebene.ursprung.z) / k)
  return {
    x: ebene.ursprung.x + ix * k,
    y: ebene.ursprung.y,
    z: ebene.ursprung.z + iz * k,
  }
}

export function innerhalbPlatte(zelle: ArLage, ebene: Ebene): boolean {
  const k = BLOCK_KANTE_METER
  const ix = Math.round((zelle.x - ebene.ursprung.x) / k)
  const iz = Math.round((zelle.z - ebene.ursprung.z) / k)
  return (
    Math.abs(ix) <= EBENE_RADIUS_ZELLEN && Math.abs(iz) <= EBENE_RADIUS_ZELLEN
  )
}

function gleicheZelle(a: ArLage, b: ArLage): boolean {
  const e = BLOCK_KANTE_METER / 4
  return (
    Math.abs(a.x - b.x) < e &&
    Math.abs(a.y - b.y) < e &&
    Math.abs(a.z - b.z) < e
  )
}

export function setzPose(
  hit: ArLage,
  ebene: Ebene,
  bestehende: ArLage[],
): ArLage | null {
  const k = BLOCK_KANTE_METER
  const boden = rasterAufEbene(hit, ebene)
  if (!innerhalbPlatte(boden, ebene)) return null
  const spalte = bestehende.filter(
    (pose) =>
      Math.abs(pose.x - boden.x) < k / 4 && Math.abs(pose.z - boden.z) < k / 4,
  )
  const y = spalte.length === 0 ? boden.y : Math.max(...spalte.map((p) => p.y)) + k
  const zelle = { x: boden.x, y, z: boden.z }
  if (bestehende.some((pose) => gleicheZelle(pose, zelle))) return null
  return zelle
}
