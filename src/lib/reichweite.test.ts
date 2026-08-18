import { describe, expect, it } from "vitest"
import { sehenswuerdigkeitById } from "./katalog"
import { istInReichweite } from "./reichweite"

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
