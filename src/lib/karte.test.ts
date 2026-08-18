import { describe, expect, it } from "vitest"
import { listSehenswuerdigkeiten } from "./katalog"
import {
  BERN_KARTE,
  liegtAufKarte,
  pixelFuerLage,
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
