import { describe, expect, it } from "vitest"
import {
  baueAb,
  grabTiefe,
  MINE_MAX_TIEFE,
  mineSchluessel,
  naechsteSchicht,
  parseMine,
  schichtBlock,
} from "./mine"

describe("schichtBlock", () => {
  it("is deterministic and respects the layer bands", () => {
    expect(schichtBlock("s", 1, 2, 5)).toBe(schichtBlock("s", 1, 2, 5))
    for (let ix = -5; ix <= 5; ix++) {
      for (let iz = -5; iz <= 5; iz++) {
        expect(["erde", "kies"]).toContain(schichtBlock("s", ix, iz, 1))
        expect(["kohleerz", "bruchstein", "stein"]).toContain(
          schichtBlock("s", ix, iz, 4),
        )
        expect(["eisenerz", "golderz", "granit", "stein"]).toContain(
          schichtBlock("s", ix, iz, 9),
        )
        expect(["diamanterz", "lehm", "granit", "stein"]).toContain(
          schichtBlock("s", ix, iz, 15),
        )
      }
    }
  })

  it("actually yields some ore somewhere", () => {
    let erze = 0
    for (let ix = -5; ix <= 5; ix++) {
      for (let iz = -5; iz <= 5; iz++) {
        for (let tiefe = 3; tiefe <= MINE_MAX_TIEFE; tiefe++) {
          if (schichtBlock("s", ix, iz, tiefe).endsWith("erz")) erze++
        }
      }
    }
    expect(erze).toBeGreaterThan(20)
  })
})

describe("graben", () => {
  it("digs layer by layer down to bedrock", () => {
    let stand: string[] = []
    const erste = baueAb(stand, 0, 0)
    expect(erste?.tiefe).toBe(1)
    stand = erste!.abgebaut
    expect(grabTiefe(stand, 0, 0)).toBe(1)
    expect(naechsteSchicht(stand, 0, 0)?.tiefe).toBe(2)
    for (let i = 2; i <= MINE_MAX_TIEFE; i++) {
      stand = baueAb(stand, 0, 0)!.abgebaut
    }
    expect(grabTiefe(stand, 0, 0)).toBe(MINE_MAX_TIEFE)
    expect(naechsteSchicht(stand, 0, 0)).toBeNull()
    expect(baueAb(stand, 0, 0)).toBeNull()
    // Nachbarspalte ist unabhängig
    expect(naechsteSchicht(stand, 1, 0)?.tiefe).toBe(1)
  })

  it("rejects digging outside the plate", () => {
    expect(naechsteSchicht([], 6, 0)).toBeNull()
  })
})

describe("parseMine", () => {
  it("keeps only valid keys", () => {
    expect(
      parseMine([
        mineSchluessel(0, 0, 1),
        mineSchluessel(0, 0, 1),
        "quatsch",
        "9,0,1",
        "0,0,99",
        42,
      ]),
    ).toEqual(["0,0,1"])
    expect(parseMine("kaputt")).toEqual([])
  })
})
