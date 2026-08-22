import { describe, expect, it } from "vitest"
import { abbauDrop } from "./abbauen"
import type { GesetzterBlock } from "./bauen"
import {
  ernteDrops,
  kannPflanzen,
  WACHSZEIT_BAUM_MS,
  WACHSZEIT_WEIZEN_MS,
  wendeWachstumAn,
} from "./wachstum"

function block(
  gegenstandId: string,
  ix: number,
  iy: number,
  iz: number,
  gesetztUm?: number,
): GesetzterBlock {
  return {
    id: `${gegenstandId}-${ix}-${iy}-${iz}`,
    gegenstandId,
    zelle: { ix, iy, iz },
    gesetztUm,
  }
}

describe("kannPflanzen", () => {
  it("allows planting on the plate floor and on dirt or grass", () => {
    expect(kannPflanzen([], "setzling", { ix: 0, iy: 0, iz: 0 })).toBe(true)
    expect(
      kannPflanzen([block("erde", 1, 0, 1)], "samen", { ix: 1, iy: 1, iz: 1 }),
    ).toBe(true)
    expect(
      kannPflanzen([block("stein", 1, 0, 1)], "samen", { ix: 1, iy: 1, iz: 1 }),
    ).toBe(false)
    expect(kannPflanzen([], "setzling", { ix: 0, iy: 2, iz: 0 })).toBe(false)
    expect(kannPflanzen([], "stein", { ix: 0, iy: 5, iz: 0 })).toBe(true)
  })
})

describe("wendeWachstumAn", () => {
  it("turns ripe seeds into wheat and leaves young ones alone", () => {
    const start = [block("samen", 0, 0, 0, 1000)]
    const zuFrueh = wendeWachstumAn(start, 1000 + WACHSZEIT_WEIZEN_MS - 1)
    expect(zuFrueh).toBe(start)
    const reif = wendeWachstumAn(start, 1000 + WACHSZEIT_WEIZEN_MS)
    expect(reif).toHaveLength(1)
    expect(reif[0].gegenstandId).toBe("weizen")
    expect(reif[0].gesetztUm).toBeUndefined()
  })

  it("grows a ripe sapling into trunk plus leaves", () => {
    const start = [block("setzling", 0, 0, 0, 0)]
    const baum = wendeWachstumAn(start, WACHSZEIT_BAUM_MS)
    const arten = baum.map((b) => b.gegenstandId)
    expect(arten.filter((a) => a === "holz")).toHaveLength(2)
    expect(arten.filter((a) => a === "laub")).toHaveLength(6)
    expect(arten).not.toContain("setzling")
  })

  it("skips occupied and out-of-bounds cells when growing", () => {
    const start = [
      block("setzling", 5, 0, 5, 0),
      block("stein", 5, 2, 5),
    ]
    const baum = wendeWachstumAn(start, WACHSZEIT_BAUM_MS)
    // Kronen-Zentrum ist belegt, ix/iz 6 liegt ausserhalb der Platte
    expect(baum.some((b) => b.gegenstandId === "stein")).toBe(true)
    expect(
      baum.every(
        (b) => Math.abs(b.zelle.ix) <= 5 && Math.abs(b.zelle.iz) <= 5,
      ),
    ).toBe(true)
    expect(baum.filter((b) => b.gegenstandId === "holz")).toHaveLength(2)
  })

  it("does not grow blocks without a timestamp", () => {
    const start = [block("samen", 0, 0, 0)]
    expect(wendeWachstumAn(start, Number.MAX_SAFE_INTEGER)).toBe(start)
  })
})

describe("ernteDrops", () => {
  it("gives wheat plus seeds for wheat, nothing for water, defaults otherwise", () => {
    const weizen = ernteDrops("weizen", abbauDrop, () => 0.9)
    expect(weizen).toEqual([
      { gegenstandId: "weizen", anzahl: 1 },
      { gegenstandId: "samen", anzahl: 1 },
    ])
    const viel = ernteDrops("weizen", abbauDrop, () => 0.1)
    expect(viel[1].anzahl).toBe(2)
    expect(ernteDrops("wasser", abbauDrop)).toEqual([])
    expect(ernteDrops("stein", abbauDrop)).toEqual([
      { gegenstandId: "bruchstein", anzahl: 1 },
    ])
  })
})
