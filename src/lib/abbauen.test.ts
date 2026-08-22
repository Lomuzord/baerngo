import { describe, expect, it } from "vitest"
import {
  PICKEL_HALTBARKEIT,
  abbauDrop,
  abbaudauerMs,
  anzeigeHaltbarkeit,
  haltbarkeitNachZugang,
  istPickel,
  nutzePickel,
  pickelHaltbarkeitFuer,
  rissStufeVonAnteil,
} from "./abbauen"

describe("abbaudauerMs", () => {
  it("breaks faster with a pickaxe and slower by hand, harder blocks take longer", () => {
    expect(abbaudauerMs("stein", "pickel")).toBeLessThan(
      abbaudauerMs("stein", null),
    )
    expect(abbaudauerMs("stamm", "axt")).toBeLessThan(abbaudauerMs("stamm", "pickel"))
    expect(abbaudauerMs("stein", "pickel")).toBeLessThan(
      abbaudauerMs("stein", "axt"),
    )
    expect(abbaudauerMs("eisen", null)).toBeGreaterThan(abbaudauerMs("kies", null))
  })
})

describe("Werkzeugstufen", () => {
  it("gets faster with each pickaxe tier like Minecraft", () => {
    expect(abbaudauerMs("stein", "holzpickel")).toBeLessThan(
      abbaudauerMs("stein", null),
    )
    expect(abbaudauerMs("stein", "pickel")).toBeLessThan(
      abbaudauerMs("stein", "holzpickel"),
    )
    expect(abbaudauerMs("stein", "eisenpickel")).toBeLessThan(
      abbaudauerMs("stein", "pickel"),
    )
    expect(abbaudauerMs("stein", "diamantpickel")).toBeLessThan(
      abbaudauerMs("stein", "eisenpickel"),
    )
  })

  it("gives higher tiers more durability", () => {
    expect(pickelHaltbarkeitFuer("holzpickel")).toBeLessThan(
      pickelHaltbarkeitFuer("pickel"),
    )
    expect(pickelHaltbarkeitFuer("pickel")).toBe(PICKEL_HALTBARKEIT)
    expect(pickelHaltbarkeitFuer("eisenpickel")).toBeLessThan(
      pickelHaltbarkeitFuer("diamantpickel"),
    )
    expect(istPickel("diamantpickel")).toBe(true)
    expect(istPickel("axt")).toBe(false)
  })

  it("wears each tier down under its own id", () => {
    const nutzung = nutzePickel({ eisenpickel: 1 }, 1, "eisenpickel")
    expect(nutzung.zerbrochen).toBe(true)
    expect(nutzung.inventar.eisenpickel).toBeUndefined()
  })

  it("drops cobblestone when stone is mined, like real Minecraft", () => {
    expect(abbauDrop("stein")).toBe("bruchstein")
    expect(abbauDrop("gras")).toBe("gras")
    expect(abbauDrop("diamanterz")).toBe("diamanterz")
  })
})

describe("rissStufeVonAnteil", () => {
  it("grows cracks while a hold is in progress", () => {
    expect(rissStufeVonAnteil(0)).toBe(0)
    expect(rissStufeVonAnteil(0.2)).toBe(1)
    expect(rissStufeVonAnteil(0.5)).toBe(2)
    expect(rissStufeVonAnteil(0.9)).toBe(3)
  })
})

describe("nutzePickel", () => {
  it("wears the pickaxe down and removes it when durability runs out", () => {
    const fastLeer = nutzePickel({ pickel: 1, stein: 3 }, 1)
    expect(fastLeer.zerbrochen).toBe(true)
    expect(fastLeer.inventar.pickel).toBeUndefined()
    expect(fastLeer.inventar.stein).toBe(3)
    expect(fastLeer.haltbarkeit).toBe(0)

    const nochGanz = nutzePickel({ pickel: 1 }, PICKEL_HALTBARKEIT)
    expect(nochGanz.zerbrochen).toBe(false)
    expect(nochGanz.haltbarkeit).toBe(PICKEL_HALTBARKEIT - 1)
    expect(nochGanz.inventar.pickel).toBe(1)
  })

  it("gives a fresh durability bar when the first pickaxe is crafted", () => {
    expect(haltbarkeitNachZugang(0, 0, 1)).toBe(PICKEL_HALTBARKEIT)
    expect(haltbarkeitNachZugang(12, 1, 1)).toBe(12)
    expect(haltbarkeitNachZugang(8, 1, 0)).toBe(0)
    expect(anzeigeHaltbarkeit(0, 1)).toBe(PICKEL_HALTBARKEIT)
    expect(anzeigeHaltbarkeit(9, 1)).toBe(9)
    expect(anzeigeHaltbarkeit(0, 0)).toBe(0)
  })
})
