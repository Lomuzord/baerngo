export type ArLage = {
  x: number
  y: number
  z: number
}

export type GesetzterBlock = {
  id: string
  gegenstandId: string
  lat: number
  lng: number
  ar?: ArLage
}

export function neuerBlock(
  gegenstandId: string,
  lat: number,
  lng: number,
  ar?: ArLage,
): GesetzterBlock {
  return {
    id: `${gegenstandId}-${lat.toFixed(5)}-${lng.toFixed(5)}-${Date.now()}`,
    gegenstandId,
    lat,
    lng,
    ...(ar ? { ar } : {}),
  }
}

export function istAbbauWerkzeug(gegenstandId: string): boolean {
  return gegenstandId === "pickel"
}

export function hatAbbauWerkzeug(inventar: Record<string, number>): boolean {
  return (inventar.pickel ?? 0) > 0
}

export function entferneBlock(
  bloecke: GesetzterBlock[],
  blockId: string,
): GesetzterBlock[] {
  return bloecke.filter((block) => block.id !== blockId)
}

export function blockById(
  bloecke: GesetzterBlock[],
  blockId: string,
): GesetzterBlock | undefined {
  return bloecke.find((block) => block.id === blockId)
}
