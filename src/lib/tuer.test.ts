import { describe, expect, it } from "vitest"
import type { GesetzterBlock } from "./bauen"
import { tuerGespiegelt, tuerWinkel } from "./tuer"

function tuer(ix: number, iy = 0, iz = 0): GesetzterBlock {
  return {
    id: `tuer-${ix}-${iy}-${iz}`,
    gegenstandId: "tuer",
    zelle: { ix, iy, iz },
  }
}

describe("tuerGespiegelt", () => {
  it("mirrors only the right wing of a pair", () => {
    const paar = [tuer(0), tuer(1)]
    expect(tuerGespiegelt(paar, paar[0]!)).toBe(false)
    expect(tuerGespiegelt(paar, paar[1]!)).toBe(true)
  })

  it("leaves a single door alone", () => {
    const eine = [tuer(3)]
    expect(tuerGespiegelt(eine, eine[0]!)).toBe(false)
  })

  it("ignores doors on another row, height or block type", () => {
    const block = tuer(1)
    expect(tuerGespiegelt([tuer(0, 0, 5), block], block)).toBe(false)
    expect(tuerGespiegelt([tuer(0, 3, 0), block], block)).toBe(false)
    const stein = {
      id: "stein-0-0-0",
      gegenstandId: "stein",
      zelle: { ix: 0, iy: 0, iz: 0 },
    }
    expect(tuerGespiegelt([stein, block], block)).toBe(false)
  })
})

describe("tuerWinkel", () => {
  it("swings the two wings apart and closes flat", () => {
    expect(tuerWinkel(false, false)).toBe(0)
    expect(tuerWinkel(false, true)).toBe(0)
    expect(tuerWinkel(true, false)).toBeCloseTo(Math.PI / 2)
    expect(tuerWinkel(true, true)).toBeCloseTo(-Math.PI / 2)
  })
})
