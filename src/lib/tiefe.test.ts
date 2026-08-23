import { describe, expect, it } from "vitest"
import {
  tiefeToleranz,
  tiefeHinweis,
  tiefeInMetern,
  tiefeMoeglich,
  tiefeVerdeckt,
  tiefenOptionen,
} from "./tiefe"

describe("tiefenOptionen", () => {
  it("asks for the CPU path so three.js keeps its hands off", () => {
    const optionen = tiefenOptionen()
    expect(optionen.usagePreference).toEqual(["cpu-optimized"])
    expect(optionen.dataFormatPreference).toEqual(["luminance-alpha"])
    expect(optionen.matchDepthView).toBe(true)
  })
})

describe("tiefeMoeglich", () => {
  it("only accepts a session that really enabled CPU depth", () => {
    expect(
      tiefeMoeglich({
        enabledFeatures: ["hit-test", "depth-sensing"],
        depthUsage: "cpu-optimized",
      }),
    ).toBe(true)
    expect(
      tiefeMoeglich({ enabledFeatures: ["hit-test"], depthUsage: "cpu-optimized" }),
    ).toBe(false)
    expect(
      tiefeMoeglich({
        enabledFeatures: ["depth-sensing"],
        depthUsage: "gpu-optimized",
      }),
    ).toBe(false)
    expect(tiefeMoeglich({})).toBe(false)
    expect(tiefeMoeglich(null)).toBe(false)
  })
})

describe("tiefeInMetern", () => {
  it("unpacks ARCore's two-byte millimetres", () => {
    // 1500 mm = 1.5 m: unteres Byte 220, oberes Byte 5
    const unten = 220 / 255
    const oben = 5 / 255
    expect(tiefeInMetern(unten, oben, 0.001)).toBeCloseTo(1.5, 5)
    expect(tiefeInMetern(0, 0, 0.001)).toBe(0)
  })
})

describe("tiefeToleranz", () => {
  it("grows with distance but stays inside sane limits", () => {
    expect(tiefeToleranz(1)).toBeCloseTo(0.05)
    expect(tiefeToleranz(3)).toBeCloseTo(0.12)
    expect(tiefeToleranz(0.2)).toBe(0.05)
    expect(tiefeToleranz(50)).toBe(0.35)
  })
})

describe("tiefeVerdeckt", () => {
  it("hides a block only when the real world is clearly in front", () => {
    expect(tiefeVerdeckt(1.0, 3.0)).toBe(true)
    expect(tiefeVerdeckt(3.0, 1.0)).toBe(false)
    // Gleich weit: nicht wegschneiden, sonst flimmert es
    expect(tiefeVerdeckt(2.0, 2.0)).toBe(false)
    expect(tiefeVerdeckt(2.0, 2.05)).toBe(false)
    // Keine Messung (0) darf nie verdecken
    expect(tiefeVerdeckt(0, 5)).toBe(false)
  })

  it("lets a person at 3 m stand on a plate that continues behind them", () => {
    // Beine bei 3 m, Platte dahinter bei 5 m -> Platte weg
    expect(tiefeVerdeckt(3.0, 5.0)).toBe(true)
    // Direkt an den Füssen (fast gleiche Tiefe) bleibt die Platte
    expect(tiefeVerdeckt(3.0, 3.05)).toBe(false)
  })
})

describe("tiefeHinweis", () => {
  it("explains each state in plain words", () => {
    expect(tiefeHinweis(false, true)).toContain("keine Tiefendaten")
    expect(tiefeHinweis(true, true)).toContain("Verdeckung an")
    expect(tiefeHinweis(true, false)).toContain("Verdeckung aus")
  })
})
