import { describe, expect, it } from "vitest"
import {
  BRUNNEN,
  neuGesammelt,
  parseBrunnenStand,
  sammlungKomplett,
} from "./brunnen"
import { BERN_KARTE } from "./karte"
import { distanzMeter } from "./reichweite"

describe("BRUNNEN", () => {
  it("has the eight old-town fountains inside the Bern frame", () => {
    expect(BRUNNEN).toHaveLength(8)
    const ids = new Set(BRUNNEN.map((brunnen) => brunnen.id))
    expect(ids.size).toBe(8)
    for (const brunnen of BRUNNEN) {
      // Alle liegen in der Altstadt — höchstens ~2 km vom Kartenzentrum
      expect(
        distanzMeter(brunnen.lage, {
          lat: BERN_KARTE.lat,
          lng: BERN_KARTE.lng,
        }),
      ).toBeLessThan(2000)
    }
  })
})

describe("neuGesammelt", () => {
  it("collects a fountain when standing next to it, once", () => {
    const kindli = BRUNNEN[0]!
    expect(neuGesammelt([], kindli.lage)).toContain(kindli.id)
    expect(neuGesammelt([kindli.id], kindli.lage)).not.toContain(kindli.id)
    expect(neuGesammelt([], { lat: 46.96, lng: 7.47 })).toHaveLength(0)
  })
})

describe("sammlungKomplett & parseBrunnenStand", () => {
  it("detects completion and cleans bad storage", () => {
    const alle = BRUNNEN.map((brunnen) => brunnen.id)
    expect(sammlungKomplett(alle)).toBe(true)
    expect(sammlungKomplett(alle.slice(1))).toBe(false)
    expect(parseBrunnenStand(null)).toEqual({ gesammelt: [], belohnt: false })
    expect(
      parseBrunnenStand({ gesammelt: [alle[0], "quatsch", alle[0]], belohnt: true }),
    ).toEqual({ gesammelt: [alle[0]], belohnt: true })
  })
})
