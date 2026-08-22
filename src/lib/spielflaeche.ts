export const BLOCK_KANTE_METER = 0.16
export const EBENE_RADIUS_ZELLEN = 5
export const PLATTE_MAX_HOEHE = 32

export type ArLage = {
  x: number
  y: number
  z: number
}

export type Zelle = {
  ix: number
  iy: number
  iz: number
}

export type Ebene = {
  ursprung: ArLage
  // Kantenlänge eines Blocks in Metern; ohne Angabe Tischgrösse.
  // Lebensgross (wie echtes Minecraft) = 1 m.
  kante?: number
}

export const TISCH_EBENE: Ebene = { ursprung: { x: 0, y: 0, z: 0 } }

export function ebenenKante(ebene: Ebene): number {
  return ebene.kante ?? BLOCK_KANTE_METER
}

export function plattenSeiteMeter(kante = BLOCK_KANTE_METER): number {
  return (EBENE_RADIUS_ZELLEN * 2 + 1) * kante
}

export function zelleVonPose(pose: ArLage, ebene: Ebene): Zelle {
  const k = ebenenKante(ebene)
  return {
    ix: rasterIndex(pose.x - ebene.ursprung.x, k),
    iy: rasterIndex(pose.y - ebene.ursprung.y, k),
    iz: rasterIndex(pose.z - ebene.ursprung.z, k),
  }
}

function rasterIndex(delta: number, kante: number): number {
  const n = Math.round(delta / kante)
  return n === 0 ? 0 : n
}

export function poseVonZelle(zelle: Zelle, ebene: Ebene): ArLage {
  const k = ebenenKante(ebene)
  return {
    x: ebene.ursprung.x + zelle.ix * k,
    y: ebene.ursprung.y + zelle.iy * k,
    z: ebene.ursprung.z + zelle.iz * k,
  }
}

export function rasterAufEbene(punkt: ArLage, ebene: Ebene): ArLage {
  return poseVonZelle(
    { ...zelleVonPose(punkt, ebene), iy: 0 },
    ebene,
  )
}

export function innerhalbPlatte(zelle: ArLage, ebene: Ebene): boolean {
  const raster = zelleVonPose(zelle, ebene)
  return (
    Math.abs(raster.ix) <= EBENE_RADIUS_ZELLEN &&
    Math.abs(raster.iz) <= EBENE_RADIUS_ZELLEN
  )
}

export type FlaechenTreffer =
  | { zelle: Zelle; normale: ArLage }
  | { punkt: ArLage }

export function naechsteZelle(
  hit: ArLage,
  ebene: Ebene,
  bestehende: Zelle[],
): Zelle | null {
  const raster = zelleVonPose(hit, ebene)
  if (
    Math.abs(raster.ix) > EBENE_RADIUS_ZELLEN ||
    Math.abs(raster.iz) > EBENE_RADIUS_ZELLEN
  ) {
    return null
  }
  const hoehe = bestehende
    .filter((zelle) => zelle.ix === raster.ix && zelle.iz === raster.iz)
    .reduce((max, zelle) => Math.max(max, zelle.iy + 1), 0)
  if (hoehe >= PLATTE_MAX_HOEHE) return null
  const zelle = { ix: raster.ix, iy: hoehe, iz: raster.iz }
  if (zelleBelegt(zelle, bestehende)) return null
  return zelle
}

export function zelleAnFlaeche(
  treffer: FlaechenTreffer,
  ebene: Ebene,
  bestehende: Zelle[],
): Zelle | null {
  const zelle =
    "zelle" in treffer
      ? versetzeAnNormale(treffer.zelle, treffer.normale)
      : { ...zelleVonPose(treffer.punkt, ebene), iy: 0 }
  if (!zelleAufPlatte(zelle) || zelleBelegt(zelle, bestehende)) return null
  return zelle
}

export function flaecheVonPunkt(
  zentrum: ArLage,
  punkt: ArLage,
  // kante bleibt in der Signatur, damit Aufrufer die Trefferfläche kennen –
  // die Flächenwahl braucht nur die dominante Achse.
  _kante?: number,
): ArLage {
  const dx = punkt.x - zentrum.x
  const dy = punkt.y - zentrum.y
  const dz = punkt.z - zentrum.z
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  const az = Math.abs(dz)
  if (ay >= ax && ay >= az) return { x: 0, y: vorzeichen(dy), z: 0 }
  if (ax >= az) return { x: vorzeichen(dx), y: 0, z: 0 }
  return { x: 0, y: 0, z: vorzeichen(dz) }
}

function vorzeichen(wert: number): number {
  return wert < 0 ? -1 : 1
}

function versetzeAnNormale(zelle: Zelle, normale: ArLage): Zelle {
  const ax = Math.abs(normale.x)
  const ay = Math.abs(normale.y)
  const az = Math.abs(normale.z)
  if (ax >= ay && ax >= az) {
    return { ...zelle, ix: zelle.ix + (normale.x >= 0 ? 1 : -1) }
  }
  if (ay >= az) {
    return { ...zelle, iy: zelle.iy + (normale.y >= 0 ? 1 : -1) }
  }
  return { ...zelle, iz: zelle.iz + (normale.z >= 0 ? 1 : -1) }
}

function zelleAufPlatte(zelle: Zelle): boolean {
  return (
    Math.abs(zelle.ix) <= EBENE_RADIUS_ZELLEN &&
    Math.abs(zelle.iz) <= EBENE_RADIUS_ZELLEN &&
    zelle.iy >= 0 &&
    zelle.iy < PLATTE_MAX_HOEHE
  )
}

function zelleBelegt(zelle: Zelle, bestehende: Zelle[]): boolean {
  return bestehende.some(
    (alt) => alt.ix === zelle.ix && alt.iy === zelle.iy && alt.iz === zelle.iz,
  )
}

export function setzPose(
  hit: ArLage,
  ebene: Ebene,
  bestehende: ArLage[],
): ArLage | null {
  const zelle = naechsteZelle(
    hit,
    ebene,
    bestehende.map((pose) => zelleVonPose(pose, ebene)),
  )
  return zelle ? poseVonZelle(zelle, ebene) : null
}
