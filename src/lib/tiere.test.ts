import { describe, expect, it } from "vitest"
import { istTier, tierDrops, tierFuerUmwelt } from "./tiere"

describe("tierFuerUmwelt", () => {
  it("spawns chickens in parks, all three on fields, none elsewhere", () => {
    expect(tierFuerUmwelt("park", () => 0.1)).toBe("huhn")
    expect(tierFuerUmwelt("park", () => 0.5)).toBeNull()
    expect(tierFuerUmwelt("feld", () => 0.05)).toBe("huhn")
    expect(tierFuerUmwelt("feld", () => 0.15)).toBe("schaf")
    expect(tierFuerUmwelt("feld", () => 0.25)).toBe("kuh")
    expect(tierFuerUmwelt("feld", () => 0.9)).toBeNull()
    expect(tierFuerUmwelt("wald", () => 0.01)).toBeNull()
    expect(tierFuerUmwelt("stadt", () => 0.01)).toBeNull()
  })
})

describe("tierDrops", () => {
  it("chicken gives feather and egg", () => {
    expect(tierDrops("huhn", {}).drops).toEqual([
      { gegenstandId: "feder", anzahl: 1 },
      { gegenstandId: "ei", anzahl: 1 },
    ])
  })

  it("sheep gives more wool with shears", () => {
    expect(tierDrops("schaf", {}).drops[0]).toEqual({
      gegenstandId: "wolle",
      anzahl: 1,
    })
    expect(tierDrops("schaf", { schere: 1 }, () => 0.9).drops[0]?.anzahl).toBe(2)
    expect(tierDrops("schaf", { schere: 1 }, () => 0.1).drops[0]?.anzahl).toBe(3)
  })

  it("cow gives leather and milks a bucket when one is carried", () => {
    const ohne = tierDrops("kuh", {})
    expect(ohne.drops).toEqual([{ gegenstandId: "leder", anzahl: 1 }])
    expect(ohne.eimerWirdMilch).toBe(false)
    expect(tierDrops("kuh", { eimer: 1 }).eimerWirdMilch).toBe(true)
  })

  it("istTier knows the three animals", () => {
    expect(istTier("huhn")).toBe(true)
    expect(istTier("kuh")).toBe(true)
    expect(istTier("stein")).toBe(false)
  })
})
