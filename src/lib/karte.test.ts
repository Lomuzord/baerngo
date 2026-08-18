import { describe, expect, it } from "vitest"
import { sehenswuerdigkeitById } from "./katalog"
import { BERN_KARTE, liegtAufKarte, pixelFuerLage } from "./karte"

describe("pixelFuerLage", () => {
  it("places every catalogued Bern sight on the Mapbox Bern frame", () => {
    for (const id of ["zytglogge", "muenster", "baerengraben", "bundeshaus"]) {
      const eintrag = sehenswuerdigkeitById(id)
      expect(eintrag).toBeDefined()
      const pixel = pixelFuerLage(eintrag!.lage, BERN_KARTE)
      expect(liegtAufKarte(pixel, BERN_KARTE)).toBe(true)
    }
  })
})
