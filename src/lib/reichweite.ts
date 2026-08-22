import { ortById, type Lage } from "./orte"

export const SICHT_REICHWEITE_METER = 80
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

export function naechsterBlick(args: {
  bisher?: number
  von?: Lage
  nach: Lage
  geraet?: number
  geschwindigkeit?: number
  genauigkeit?: number
}): { blick?: number; schritt: boolean } {
  const minMeter = Math.max(2.2, Math.min(8, (args.genauigkeit ?? 10) * 0.22))
  const distanz = args.von ? distanzMeter(args.von, args.nach) : 0
  if (args.von && distanz >= minMeter) {
    return { blick: blickAusWeg(args.von, args.nach), schritt: true }
  }
  if (
    typeof args.geraet === "number" &&
    Number.isFinite(args.geraet) &&
    (args.geschwindigkeit ?? 0) > 1
  ) {
    return { blick: args.geraet, schritt: true }
  }
  return { blick: args.bisher, schritt: false }
}

export function blickAusWeg(von: Lage, nach: Lage): number {
  const phi1 = toRad(von.lat)
  const phi2 = toRad(nach.lat)
  const dLaenge = toRad(nach.lng - von.lng)
  const y = Math.sin(dLaenge) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLaenge)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export function entfernungText(distanzMeter: number): string {
  if (!Number.isFinite(distanzMeter)) return "unbekannt"
  if (distanzMeter < 1000) return `${Math.round(distanzMeter)} m`
  return `${(distanzMeter / 1000).toFixed(1)} km`
}

export function istNahGenug(
  spieler: Lage,
  ziel: Lage,
  meter: number,
): boolean {
  return distanzMeter(spieler, ziel) <= meter
}

export function kreisUm(
  mitte: Lage,
  radiusMeter: number,
  ecken = 48,
): Lage[] {
  const punkte: Lage[] = []
  for (let i = 0; i < ecken; i++) {
    const winkel = (i / ecken) * Math.PI * 2
    punkte.push(
      lageVersetzt(
        mitte,
        Math.cos(winkel) * radiusMeter,
        Math.sin(winkel) * radiusMeter,
      ),
    )
  }
  return punkte
}

export function lageVersetzt(
  ursprung: Lage,
  meterNord: number,
  meterOst: number,
): Lage {
  const meterProGradLat = 110_540
  const meterProGradLng =
    111_320 * Math.cos((ursprung.lat * Math.PI) / 180)
  return {
    lat: ursprung.lat + meterNord / meterProGradLat,
    lng: ursprung.lng + meterOst / meterProGradLng,
  }
}

export function istInReichweite(
  spieler: Lage | null,
  sehenswuerdigkeitId: string,
): Reichweite {
  const sehenswuerdigkeit = ortById(sehenswuerdigkeitId)
  if (!spieler || !sehenswuerdigkeit) {
    return { erlaubt: false, distanzMeter: Number.POSITIVE_INFINITY }
  }
  const distanz = distanzMeter(spieler, sehenswuerdigkeit.lage)
  return {
    erlaubt: distanz <= SICHT_REICHWEITE_METER,
    distanzMeter: distanz,
  }
}

function toRad(grad: number): number {
  return (grad * Math.PI) / 180
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}
