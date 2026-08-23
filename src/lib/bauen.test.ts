import { describe, expect, it } from "vitest"
import {
  aktionFuerHand,
  blockById,
  blockObenInSpalte,
  entferneBlock,
  falleBloecke,
  hatAbbauWerkzeug,
  istAbbauWerkzeug,
  kannBlockSetzen,
  nimmBlock,
  neuerBlock,
  parseBloecke,
  setzeBlock,
} from "./bauen"

describe("neuerBlock", () => {
  it("records a placed block on a play-plate cell", () => {
    const block = neuerBlock("goldblock", { ix: 1, iy: 0, iz: -2 })
    expect(block.gegenstandId).toBe("goldblock")
    expect(block.zelle).toEqual({ ix: 1, iy: 0, iz: -2 })
    expect(block.id).toContain("goldblock")
  })
})

describe("entferneBlock", () => {
  it("removes a placed block from the plate list", () => {
    expect(istAbbauWerkzeug("pickel")).toBe(true)
    expect(istAbbauWerkzeug("axt")).toBe(true)
    expect(istAbbauWerkzeug("gold")).toBe(false)
    expect(aktionFuerHand("erde")).toBe("setzen")
    expect(aktionFuerHand("pickel")).toBe("abbauen")
    expect(aktionFuerHand("axt")).toBe("abbauen")
    expect(aktionFuerHand("stock")).toBe("keine")
    expect(aktionFuerHand(null)).toBe("abbauen")
    expect(hatAbbauWerkzeug({ pickel: 1, gold: 2 })).toBe(true)
    expect(hatAbbauWerkzeug({ gold: 2 })).toBe(false)

    const erster = neuerBlock("gold", { ix: 0, iy: 0, iz: 0 })
    const zweiter = neuerBlock("stein", { ix: 1, iy: 0, iz: 0 })
    const danach = entferneBlock([erster, zweiter], erster.id)
    expect(danach).toHaveLength(1)
    expect(blockById(danach, erster.id)).toBeUndefined()
    expect(blockById(danach, zweiter.id)?.gegenstandId).toBe("stein")
  })
})

describe("parseBloecke", () => {
  it("keeps plate cells and drops old GPS-only drops", () => {
    const gelesen = parseBloecke([
      {
        id: "stein-0-0-0",
        gegenstandId: "stein",
        zelle: { ix: 0, iy: 0, iz: 0 },
      },
      { id: "gold-gps", gegenstandId: "gold", lat: 46.94, lng: 7.44 },
      { kaputt: true },
    ])
    expect(gelesen).toHaveLength(1)
    expect(gelesen[0]?.gegenstandId).toBe("stein")
    expect(parseBloecke(null)).toEqual([])
  })
})

describe("blockObenInSpalte", () => {
  it("returns the top block in a column so a plate tap can mine it", () => {
    const unten = neuerBlock("stein", { ix: 0, iy: 0, iz: 1 })
    const oben = neuerBlock("erde", { ix: 0, iy: 2, iz: 1 })
    const neben = neuerBlock("holz", { ix: 1, iy: 4, iz: 1 })
    expect(blockObenInSpalte([unten, oben, neben], { ix: 0, iz: 1 })?.id).toBe(
      oben.id,
    )
    expect(blockObenInSpalte([unten, oben], { ix: 3, iz: 3 })).toBeUndefined()
  })
})

describe("falleBloecke", () => {
  it("drops sandstone and gravel until they rest on a solid block or the plate", () => {
    const luft = neuerBlock("sandstein", { ix: 0, iy: 3, iz: 0 })
    const kies = neuerBlock("kies", { ix: 1, iy: 2, iz: 0 })
    const stein = neuerBlock("stein", { ix: 1, iy: 0, iz: 0 })
    const danach = falleBloecke([luft, kies, stein])
    expect(
      danach.find((block) => block.id === luft.id)?.zelle,
    ).toEqual({ ix: 0, iy: 0, iz: 0 })
    expect(
      danach.find((block) => block.id === kies.id)?.zelle,
    ).toEqual({ ix: 1, iy: 1, iz: 0 })
    expect(
      danach.find((block) => block.id === stein.id)?.zelle,
    ).toEqual({ ix: 1, iy: 0, iz: 0 })
    expect(danach.find((block) => block.id === luft.id)?.fallStart).toEqual({
      ix: 0,
      iy: 3,
      iz: 0,
    })
    expect(danach.find((block) => block.id === kies.id)?.fallStart).toEqual({
      ix: 1,
      iy: 2,
      iz: 0,
    })
  })

  it("lets sandstone fall after its support is mined", () => {
    const stuetze = neuerBlock("stein", { ix: 0, iy: 0, iz: 0 })
    const sand = neuerBlock("sandstein", { ix: 0, iy: 1, iz: 0 })
    const danach = nimmBlock([stuetze, sand], stuetze.id)
    expect(danach).toHaveLength(1)
    expect(danach[0]?.zelle).toEqual({ ix: 0, iy: 0, iz: 0 })
  })

  it("places sandstone on a side face then lets it fall to the plate", () => {
    const turm = neuerBlock("stein", { ix: 0, iy: 0, iz: 0 })
    const danach = setzeBlock([turm], "sandstein", { ix: 1, iy: 1, iz: 0 })
    expect(danach).toHaveLength(2)
    expect(
      danach.find((block) => block.gegenstandId === "sandstein")?.zelle,
    ).toEqual({ ix: 1, iy: 0, iz: 0 })
  })
})

describe("Türen brauchen zwei Blöcke Höhe", () => {
  function tuerBlock(ix: number, iy: number, iz: number) {
    return {
      id: `tuer-${ix}-${iy}-${iz}`,
      gegenstandId: "tuer",
      zelle: { ix, iy, iz },
    }
  }

  it("blocks the cell above a door and needs room when placed", () => {
    const welt = [tuerBlock(0, 0, 0)]
    // Direkt über der Tür ist kein Platz mehr
    expect(kannBlockSetzen(welt, { ix: 0, iy: 1, iz: 0 })).toBe(false)
    // Daneben schon
    expect(kannBlockSetzen(welt, { ix: 1, iy: 1, iz: 0 })).toBe(true)
    // Eine Tür braucht die Zelle darüber frei
    const voll = [
      {
        id: "stein-0-1-0",
        gegenstandId: "stein",
        zelle: { ix: 0, iy: 1, iz: 0 },
      },
    ]
    expect(kannBlockSetzen(voll, { ix: 0, iy: 0, iz: 0 }, "tuer")).toBe(false)
    expect(kannBlockSetzen(voll, { ix: 0, iy: 0, iz: 0 }, "stein")).toBe(true)
  })
})
