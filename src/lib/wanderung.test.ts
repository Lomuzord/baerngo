import { describe, expect, it } from "vitest"
import {
  distanzZuwachs,
  oeffneWanderTruhe,
  parseWanderung,
  WANDER_ZIEL_METER,
  wanderText,
} from "./wanderung"

const BERN = { lat: 46.948, lng: 7.4474 }
// ~0.00027 Grad Länge ≈ 20 m in Bern
const ZWANZIG_M = { lat: 46.948, lng: 7.44766 }
const HUNDERT_M = { lat: 46.948, lng: 7.4487 }

describe("distanzZuwachs", () => {
  it("counts plausible walking and ignores jumps, jitter, bad GPS", () => {
    const schritt = distanzZuwachs(BERN, ZWANZIG_M, 10)
    expect(schritt).toBeGreaterThan(15)
    expect(schritt).toBeLessThan(25)
    expect(distanzZuwachs(BERN, HUNDERT_M, 10)).toBe(0)
    expect(distanzZuwachs(BERN, ZWANZIG_M, 50)).toBe(0)
    expect(distanzZuwachs(BERN, BERN, 10)).toBe(0)
    expect(distanzZuwachs(null, ZWANZIG_M, 10)).toBe(0)
  })
})

describe("oeffneWanderTruhe", () => {
  it("hands out exactly one of the reward bundles", () => {
    expect(oeffneWanderTruhe(() => 0)).toEqual([
      { gegenstandId: "diamant", anzahl: 1 },
    ])
    expect(oeffneWanderTruhe(() => 0.99)).toEqual([
      { gegenstandId: "smaragd", anzahl: 1 },
    ])
  })
})

describe("parseWanderung & wanderText", () => {
  it("clamps stored meters and formats progress", () => {
    expect(parseWanderung(1234.5)).toBeCloseTo(1234.5)
    expect(parseWanderung(999999)).toBe(WANDER_ZIEL_METER)
    expect(parseWanderung("kaputt")).toBe(0)
    expect(parseWanderung(-5)).toBe(0)
    expect(wanderText(1234.5)).toBe("1.2 / 2.0 km")
  })
})
