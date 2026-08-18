export type GesetzterBlock = {
  id: string
  gegenstandId: string
  lat: number
  lng: number
}

export function neuerBlock(
  gegenstandId: string,
  lat: number,
  lng: number,
): GesetzterBlock {
  return {
    id: `${gegenstandId}-${lat.toFixed(5)}-${lng.toFixed(5)}-${Date.now()}`,
    gegenstandId,
    lat,
    lng,
  }
}
