import type { Lage } from "./katalog"

export type Kartenrahmen = {
  lat: number
  lng: number
  zoom: number
  width: number
  height: number
}

export const BERN_KARTE: Kartenrahmen = {
  lat: 46.9512,
  lng: 7.4512,
  zoom: 14,
  width: 640,
  height: 480,
}

export type Pixel = {
  x: number
  y: number
}

export function pixelFuerLage(lage: Lage, rahmen: Kartenrahmen): Pixel {
  const welt = 256 * 2 ** rahmen.zoom
  const mitte = projektion(rahmen.lng, rahmen.lat)
  const punkt = projektion(lage.lng, lage.lat)
  return {
    x: rahmen.width / 2 + (punkt.x - mitte.x) * welt,
    y: rahmen.height / 2 + (punkt.y - mitte.y) * welt,
  }
}

export function weltPositionFuerLage(lage: Lage): { x: number; z: number } {
  const meterProGradLat = 110_540
  const meterProGradLng =
    111_320 * Math.cos((BERN_KARTE.lat * Math.PI) / 180)
  return {
    x: ((lage.lng - BERN_KARTE.lng) * meterProGradLng) / 25,
    z: (-(lage.lat - BERN_KARTE.lat) * meterProGradLat) / 25,
  }
}

export function liegtAufKarte(pixel: Pixel, rahmen: Kartenrahmen): boolean {
  return (
    pixel.x >= 0 &&
    pixel.y >= 0 &&
    pixel.x <= rahmen.width &&
    pixel.y <= rahmen.height
  )
}

function projektion(lng: number, lat: number): Pixel {
  const x = (lng + 180) / 360
  const sinLat = Math.sin((lat * Math.PI) / 180)
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)
  return { x, y }
}
