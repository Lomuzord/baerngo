import { describe, expect, it } from "vitest"
import type { GesetzterBlock } from "./bauen"
import { berechneStrom, SIGNAL_MAX } from "./redstone"

function block(
  gegenstandId: string,
  ix: number,
  iy: number,
  iz: number,
  an?: boolean,
): GesetzterBlock {
  return {
    id: `${gegenstandId}-${ix}-${iy}-${iz}`,
    gegenstandId,
    zelle: { ix, iy, iz },
    ...(an === undefined ? {} : { an }),
  } as GesetzterBlock
}

describe("berechneStrom", () => {
  it("powers a lamp through a dust line from a lever", () => {
    const welt = [
      block("hebel", 0, 0, 0, true),
      block("redstone", 1, 0, 0),
      block("redstone", 2, 0, 0),
      block("redstonelampe", 3, 0, 0),
    ]
    const strom = berechneStrom(welt)
    expect(strom.has("hebel-0-0-0")).toBe(true)
    expect(strom.has("redstone-1-0-0")).toBe(true)
    expect(strom.has("redstone-2-0-0")).toBe(true)
    expect(strom.has("redstonelampe-3-0-0")).toBe(true)
  })

  it("does nothing when the lever is off", () => {
    const welt = [
      block("hebel", 0, 0, 0, false),
      block("redstone", 1, 0, 0),
      block("redstonelampe", 2, 0, 0),
    ]
    expect(berechneStrom(welt).size).toBe(0)
  })

  it("decays after 15 dust cells like Minecraft", () => {
    const welt: GesetzterBlock[] = [block("redstonefackel", 0, 0, 0)]
    for (let i = 1; i <= SIGNAL_MAX + 2; i++) {
      welt.push(block("redstone", i, 0, 0))
    }
    welt.push(block("redstonelampe", SIGNAL_MAX + 3, 0, 0))
    const strom = berechneStrom(welt)
    expect(strom.has(`redstone-${SIGNAL_MAX}-0-0`)).toBe(true)
    expect(strom.has(`redstone-${SIGNAL_MAX + 1}-0-0`)).toBe(false)
    expect(strom.has(`redstonelampe-${SIGNAL_MAX + 3}-0-0`)).toBe(false)
  })

  it("torch is always on and powers adjacent consumers directly", () => {
    const welt = [
      block("redstonefackel", 0, 0, 0),
      block("redstonelampe", 1, 0, 0),
      block("tuer", 0, 1, 0),
    ]
    const strom = berechneStrom(welt)
    expect(strom.has("redstonelampe-1-0-0")).toBe(true)
    expect(strom.has("tuer-0-1-0")).toBe(true)
  })

  it("runs dust vertically too", () => {
    const welt = [
      block("hebel", 0, 0, 0, true),
      block("redstone", 0, 1, 0),
      block("redstone", 0, 2, 0),
      block("redstonelampe", 0, 3, 0),
    ]
    expect(berechneStrom(welt).has("redstonelampe-0-3-0")).toBe(true)
  })
})
