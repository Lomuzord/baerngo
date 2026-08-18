import { sehenswuerdigkeitById, type Lage } from "./katalog"

const REICHWEITE_METER = 80
const ERDE_RADIUS_METER = 6_371_000

export type Reichweite = {
  erlaubt: boolean
  distanzMeter: number
}

export function distanzMeter(von: Lage, nach: Lage): number {
  const breite1 = toRad(von.lat)
  const breite2 = toRad(nach.lat)
  const dBreite = toRad(nach.lat - von.lat)
  const dLaenge = toRad(nach.lng - von.lng)
  const a =
    Math.sin(dBreite / 2) ** 2 +
    Math.cos(breite1) * Math.cos(breite2) * Math.sin(dLaenge / 2) ** 2
  return 2 * ERDE_RADIUS_METER * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function entfernungText(distanzMeter: number): string {
  if (!Number.isFinite(distanzMeter)) return "unbekannt"
  if (distanzMeter < 1000) return `${Math.round(distanzMeter)} m`
  return `${(distanzMeter / 1000).toFixed(1)} km`
}

export function istInReichweite(
  spieler: Lage | null,
  sehenswuerdigkeitId: string,
): Reichweite {
  const sehenswuerdigkeit = sehenswuerdigkeitById(sehenswuerdigkeitId)
  if (!spieler || !sehenswuerdigkeit) {
    return { erlaubt: false, distanzMeter: Number.POSITIVE_INFINITY }
  }
  const distanz = distanzMeter(spieler, sehenswuerdigkeit.lage)
  return { erlaubt: distanz <= REICHWEITE_METER, distanzMeter: distanz }
}

function toRad(grad: number): number {
  return (grad * Math.PI) / 180
}
