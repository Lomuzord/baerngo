import { describe, expect, it } from "vitest"
import {
  blockById,
  entferneBlock,
  hatAbbauWerkzeug,
  istAbbauWerkzeug,
  neuerBlock,
} from "./bauen"

describe("neuerBlock", () => {
  it("records a placed block at the given Bern coordinates", () => {
    const block = neuerBlock("goldblock", 46.94798, 7.44743)
    expect(block.gegenstandId).toBe("goldblock")
    expect(block.lat).toBe(46.94798)
    expect(block.lng).toBe(7.44743)
    expect(block.id).toContain("goldblock")
  })

  it("keeps an AR hit-test pose when placing in a WebXR session", () => {
    const block = neuerBlock("stein", 46.94654, 7.44433, {
      x: 0.4,
      y: 0,
      z: -1.2,
    })
    expect(block.ar).toEqual({ x: 0.4, y: 0, z: -1.2 })
  })
})

describe("entferneBlock", () => {
  it("mines only with a pickaxe and returns the remaining placed blocks", () => {
    expect(istAbbauWerkzeug("pickel")).toBe(true)
    expect(istAbbauWerkzeug("gold")).toBe(false)
    expect(hatAbbauWerkzeug({ pickel: 1, gold: 2 })).toBe(true)
    expect(hatAbbauWerkzeug({ gold: 2 })).toBe(false)

    const erster = neuerBlock("gold", 46.94, 7.44)
    const zweiter = neuerBlock("stein", 46.95, 7.45)
    const danach = entferneBlock([erster, zweiter], erster.id)
    expect(danach).toHaveLength(1)
    expect(blockById(danach, erster.id)).toBeUndefined()
    expect(blockById(danach, zweiter.id)?.gegenstandId).toBe("stein")
  })
})
