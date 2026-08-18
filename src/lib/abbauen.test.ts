import { describe, expect, it } from "vitest"
import {
  PICKEL_HALTBARKEIT,
  haltbarkeitNachZugang,
  nutzePickel,
  schlageBlock,
  trefferProBlock,
} from "./abbauen"

describe("trefferProBlock", () => {
  it("lets a pickaxe break a block in one hit and the hand in four", () => {
    expect(trefferProBlock("pickel")).toBe(1)
    expect(trefferProBlock(null)).toBe(4)
    expect(trefferProBlock("gold")).toBe(4)
  })
})

describe("schlageBlock", () => {
  it("destroys immediately with a pickaxe and only after four hand hits", () => {
    const mitPickel = schlageBlock({}, "a", "pickel")
    expect(mitPickel.zerstoert).toBe(true)
    expect(mitPickel.stand.a).toBeUndefined()

    let stand = {}
    for (let i = 1; i <= 3; i++) {
      const schlag = schlageBlock(stand, "a", null)
      expect(schlag.zerstoert).toBe(false)
      stand = schlag.stand
    }
    const letzter = schlageBlock(stand, "a", null)
    expect(letzter.zerstoert).toBe(true)
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
  })
})
