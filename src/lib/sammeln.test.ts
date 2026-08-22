import { describe, expect, it } from "vitest"
import { listGegenstaende } from "./gegenstaende"
import { listSehenswuerdigkeiten } from "./katalog"
import {
  beuteFuerSehenswuerdigkeit,
  formatiereBeute,
  legeBeuteInInventar,
  parseInventar,
  ressourceFuerSehenswuerdigkeit, bonusDrop } from "./sammeln"

describe("ressourceFuerSehenswuerdigkeit", () => {
  it("gives Gold at the Zytglogge and a book at the GIBB", () => {
    expect(ressourceFuerSehenswuerdigkeit("zytglogge")?.id).toBe("gold")
    expect(ressourceFuerSehenswuerdigkeit("gibb")?.id).toBe("buch")
  })

  it("gives every catalogued sight its own resource", () => {
    const ids = new Set<string>()
    for (const eintrag of listSehenswuerdigkeiten()) {
      const ressource = ressourceFuerSehenswuerdigkeit(eintrag.id)
      expect(ressource).toBeDefined()
      expect(ids.has(ressource!.id)).toBe(false)
      ids.add(ressource!.id)
    }
  })
})

describe("beuteFuerSehenswuerdigkeit", () => {
  it("fills the chest with several building blocks, not one token drop", () => {
    const beute = beuteFuerSehenswuerdigkeit("zytglogge")
    expect(beute.length).toBeGreaterThanOrEqual(3)
    expect(beute.some((stuck) => stuck.gegenstandId === "gold")).toBe(true)
    expect(beute.some((stuck) => stuck.gegenstandId === "diamant")).toBe(true)
    expect(beute.some((stuck) => stuck.gegenstandId === "stein")).toBe(true)
    expect(formatiereBeute(beute)).toMatch(/\+5 Gold/)

    const inventar = legeBeuteInInventar({ gold: 1 }, beute)
    expect(inventar.gold).toBe(6)
    expect(inventar.stein).toBe(8)
  })

  it("gives every sight a mixed pile of placeable blocks", () => {
    for (const eintrag of listSehenswuerdigkeiten()) {
      const beute = beuteFuerSehenswuerdigkeit(eintrag.id)
      expect(beute.length).toBeGreaterThanOrEqual(3)
      const arten = new Set(beute.map((stuck) => stuck.gegenstandId))
      expect(arten.size).toBeGreaterThanOrEqual(3)
    }
  })
})

describe("placeable catalog", () => {
  it("lists more placeable materials than the sight signatures", () => {
    const sichtLoot = listSehenswuerdigkeiten().map(
      (eintrag) => ressourceFuerSehenswuerdigkeit(eintrag.id)!.id,
    )
    const alle = listGegenstaende().map((item) => item.id)
    expect(sichtLoot).toHaveLength(19)
    expect(alle.length).toBeGreaterThan(sichtLoot.length)
    for (const id of sichtLoot) {
      expect(alle).toContain(id)
    }
    expect(alle).toContain("holz")
    expect(alle).toContain("stamm")
    expect(alle).toContain("stein")
    expect(alle).toContain("stock")
    expect(alle).toContain("pickel")
    expect(alle).toContain("axt")
    expect(alle).toContain("laub")
    expect(alle).toContain("glas")
    expect(alle).toContain("granit")
    expect(alle).toContain("diamant")
    expect(alle).toContain("ofen")
    expect(alle).toContain("sand")
  })
})

describe("parseInventar", () => {
  it("keeps known positive counts and drops junk", () => {
    expect(parseInventar({ gold: 3, pickel: 1, unbekannt: 9, stein: 0 })).toEqual({
      gold: 3,
      pickel: 1,
    })
    expect(parseInventar({ gold: "2", honig: -1 })).toEqual({ gold: 2 })
    expect(parseInventar(null)).toEqual({})
  })
})

describe("bonusDrop", () => {
  it("drops setzling from laub and samen from gras, chance-gated", () => {
    expect(bonusDrop("laub", () => 0.1)).toBe("setzling")
    expect(bonusDrop("laub", () => 0.5)).toBeNull()
    expect(bonusDrop("gras", () => 0.1)).toBe("samen")
    expect(bonusDrop("gras", () => 0.5)).toBeNull()
    expect(bonusDrop("holz", () => 0)).toBeNull()
  })
})
