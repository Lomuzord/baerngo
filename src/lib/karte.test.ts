import { describe, expect, it } from "vitest"
import { listSehenswuerdigkeiten } from "./katalog"
import {
  BERN_KARTE,
  kameraFuerSpieler,
  liegtAufKarte,
  pixelFuerLage,
  SPIELER_KAMERA,
  weltPositionFuerLage,
} from "./karte"

describe("pixelFuerLage", () => {
  it("places every catalogued Bern sight on the Mapbox Bern frame", () => {
    const katalog = listSehenswuerdigkeiten()
    expect(katalog.some((eintrag) => eintrag.id === "gibb")).toBe(true)
    for (const eintrag of katalog) {
      const pixel = pixelFuerLage(eintrag.lage, BERN_KARTE)
      expect(liegtAufKarte(pixel, BERN_KARTE)).toBe(true)
    }
  })

  it("places GIBB north of the map origin in world space", () => {
    const gibb = listSehenswuerdigkeiten().find((eintrag) => eintrag.id === "gibb")
    expect(gibb).toBeDefined()
    const welt = weltPositionFuerLage(gibb!.lage)
    expect(welt.z).toBeLessThan(0)
  })
})

describe("kameraFuerSpieler", () => {
  it("frames the player at street zoom without swapping lat/lng", () => {
    const lage = { lat: 46.9546, lng: 7.44467 }
    const kamera = kameraFuerSpieler(lage)
    expect(kamera.center).toEqual([lage.lng, lage.lat])
    expect(kamera.zoom).toBe(SPIELER_KAMERA.zoom)
    expect(kamera.zoom).toBeGreaterThan(16)
    expect(kamera.pitch).toBe(SPIELER_KAMERA.pitch)
  })
})
