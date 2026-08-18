import { describe, expect, it } from "vitest"
import { listSehenswuerdigkeiten } from "./katalog"
import { BERN_KARTE, liegtAufKarte, pixelFuerLage } from "./karte"

describe("pixelFuerLage", () => {
  it("places every catalogued Bern sight on the Mapbox Bern frame", () => {
    const katalog = listSehenswuerdigkeiten()
    expect(katalog.some((eintrag) => eintrag.id === "gibb")).toBe(true)
    for (const eintrag of katalog) {
      const pixel = pixelFuerLage(eintrag.lage, BERN_KARTE)
      expect(liegtAufKarte(pixel, BERN_KARTE)).toBe(true)
    }
  })
})
