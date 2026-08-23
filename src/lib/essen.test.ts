import { describe, expect, it } from "vitest"
import {
  boostAktiv,
  boostRestMs,
  essenArt,
  istEssen,
  iss,
  parseBoost,
  radiusFaktor,
  spawnBonus,
} from "./essen"

const T = 1_000_000

describe("istEssen", () => {
  it("knows the three foods and nothing else", () => {
    expect(istEssen("brot")).toBe(true)
    expect(istEssen("honigbrot")).toBe(true)
    expect(istEssen("kuchen")).toBe(true)
    expect(istEssen("stein")).toBe(false)
    expect(essenArt("brot")?.dauerMs).toBe(10 * 60_000)
  })
})

describe("iss", () => {
  it("starts a boost and extends the same kind instead of resetting", () => {
    const eins = iss(null, "brot", T)
    expect(eins).toEqual({ art: "radius", bis: T + 10 * 60_000 })
    const zwei = iss(eins, "brot", T + 60_000)
    // Verlängert ab dem alten Ende, nicht ab jetzt
    expect(zwei?.bis).toBe(T + 20 * 60_000)
  })

  it("replaces a different boost and ignores non-food", () => {
    const brot = iss(null, "brot", T)
    const honig = iss(brot, "honigbrot", T)
    expect(honig).toEqual({ art: "spawn", bis: T + 15 * 60_000 })
    expect(iss(honig, "stein", T)).toBe(honig)
  })

  it("restarts from now when the old boost already expired", () => {
    const alt = iss(null, "brot", T)
    const neu = iss(alt, "brot", T + 99 * 60_000)
    expect(neu?.bis).toBe(T + 109 * 60_000)
  })
})

describe("Wirkung", () => {
  it("bread widens the reach, honey bread adds spawns, cake does both", () => {
    const brot = iss(null, "brot", T)
    expect(radiusFaktor(brot, T)).toBeCloseTo(1.4)
    expect(spawnBonus(brot, T)).toBe(0)

    const honig = iss(null, "honigbrot", T)
    expect(radiusFaktor(honig, T)).toBe(1)
    expect(spawnBonus(honig, T)).toBe(4)

    const kuchen = iss(null, "kuchen", T)
    expect(radiusFaktor(kuchen, T)).toBeCloseTo(1.4)
    expect(spawnBonus(kuchen, T)).toBe(4)
  })

  it("stops working once it ran out", () => {
    const brot = iss(null, "brot", T)
    const spaeter = T + 11 * 60_000
    expect(boostAktiv(brot, spaeter)).toBe(false)
    expect(radiusFaktor(brot, spaeter)).toBe(1)
    expect(spawnBonus(brot, spaeter)).toBe(0)
    expect(boostRestMs(brot, spaeter)).toBe(0)
    expect(boostRestMs(brot, T)).toBe(10 * 60_000)
  })
})

describe("parseBoost", () => {
  it("keeps valid storage and drops junk", () => {
    expect(parseBoost({ art: "radius", bis: 5 })).toEqual({
      art: "radius",
      bis: 5,
    })
    expect(parseBoost({ art: "quatsch", bis: 5 })).toBeNull()
    expect(parseBoost({ art: "radius" })).toBeNull()
    expect(parseBoost(null)).toBeNull()
  })
})
