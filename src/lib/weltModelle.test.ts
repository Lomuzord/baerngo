import { describe, expect, it } from "vitest"
import { listWeltModelle, trefferWeltModell } from "./weltModelle"

describe("listWeltModelle", () => {
  it("places a tall bear at the Bärengraben and a civic dome on the Bundeshaus", () => {
    const modelle = listWeltModelle()
    const baer = modelle.find((modell) => modell.id === "baerengraben")
    const bund = modelle.find((modell) => modell.id === "bundeshaus")
    expect(baer?.hoeheMeter).toBeGreaterThan(20)
    expect(bund?.hoeheMeter).toBeGreaterThan(baer!.hoeheMeter)
    expect(bund?.lochMeter).toBeGreaterThan(50)
  })
})

describe("trefferWeltModell", () => {
  it("hits a model when the tap is on its screen footprint", () => {
    const modelle = listWeltModelle()
    const bund = modelle.find((modell) => modell.id === "bundeshaus")
    expect(bund).toBeDefined()
    const projektion = ([lng, lat]: [number, number]) => ({
      x: (lng - bund!.lage.lng) * 100_000,
      y: (bund!.lage.lat - lat) * 100_000,
    })
    expect(trefferWeltModell({ x: 0, y: 0 }, projektion, modelle)).toBe(
      "bundeshaus",
    )
    expect(trefferWeltModell({ x: 8000, y: 8000 }, projektion, modelle)).toBe(
      null,
    )
  })
})
