import { describe, expect, it } from "vitest"
import { sehenswuerdigkeitById } from "./katalog"
import { entfernungText, istInReichweite } from "./reichweite"

describe("istInReichweite", () => {
  it("unlocks the quiz when the player is at the Zytglogge", () => {
    const zytglogge = sehenswuerdigkeitById("zytglogge")
    expect(zytglogge).toBeDefined()
    const reichweite = istInReichweite(zytglogge!.lage, "zytglogge")
    expect(reichweite.erlaubt).toBe(true)
    expect(reichweite.distanzMeter).toBeLessThan(1)
  })

  it("keeps the quiz locked when the player is far from Bern", () => {
    const reichweite = istInReichweite({ lat: 0, lng: 0 }, "zytglogge")
    expect(reichweite.erlaubt).toBe(false)
    expect(reichweite.distanzMeter).toBeGreaterThan(1_000)
  })
})

describe("entfernungText", () => {
  it("shows metres nearby and kilometres farther away", () => {
    expect(entfernungText(42)).toBe("42 m")
    expect(entfernungText(2450)).toBe("2.5 km")
    expect(entfernungText(Number.POSITIVE_INFINITY)).toBe("unbekannt")
  })
})
