import { describe, expect, it } from "vitest"
import { distanzZuwachs } from "./wanderung"

const BERN = { lat: 46.948, lng: 7.4474 }
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
