import { describe, expect, it } from "vitest"
import { tagesTint, wetterArt } from "./himmel"

describe("tagesTint", () => {
  it("is dark at night, clear at midday, warm at dusk", () => {
    expect(tagesTint(23).staerke).toBeGreaterThan(0.3)
    expect(tagesTint(3).staerke).toBeGreaterThan(0.3)
    expect(tagesTint(13).staerke).toBe(0)
    const dämmerung = tagesTint(20)
    expect(dämmerung.staerke).toBeGreaterThan(0)
    expect(dämmerung.staerke).toBeLessThan(0.3)
  })

  it("fades smoothly out of the night in the morning", () => {
    expect(tagesTint(5.6).staerke).toBeLessThanOrEqual(tagesTint(5).staerke)
    expect(tagesTint(7.9).staerke).toBeLessThan(tagesTint(6.6).staerke)
  })
})

describe("wetterArt", () => {
  it("maps WMO codes to rain, snow, and clear", () => {
    expect(wetterArt(0)).toBe("klar")
    expect(wetterArt(2)).toBe("klar")
    expect(wetterArt(61)).toBe("regen")
    expect(wetterArt(81)).toBe("regen")
    expect(wetterArt(95)).toBe("regen")
    expect(wetterArt(71)).toBe("schnee")
    expect(wetterArt(85)).toBe("schnee")
    expect(wetterArt(Number.NaN)).toBe("klar")
  })
})
