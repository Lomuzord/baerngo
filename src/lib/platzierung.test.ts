import { describe, expect, it } from "vitest"
import { listSichtModelle, sichtModellById } from "./platzierung"

describe("sichtModellById", () => {
  it("assigns a Minecraft block model at real Bern coordinates for Zytglogge", () => {
    const modell = sichtModellById("zytglogge")
    expect(modell).toBeDefined()
    expect(modell!.name).toMatch(/Zytglogge/)
    expect(modell!.modellId).toBe("mc-block-zytglogge")
    expect(modell!.lage.lat).toBeGreaterThan(46.9)
    expect(modell!.lage.lat).toBeLessThan(47.0)
    expect(modell!.lage.lng).toBeGreaterThan(7.4)
    expect(modell!.lage.lng).toBeLessThan(7.5)
    expect(modell!.textur).toMatch(/\/bloecke\//)
  })

  it("assigns a Minecraft block model at real Bern coordinates for GIBB", () => {
    const modell = sichtModellById("gibb")
    expect(modell).toBeDefined()
    expect(modell!.name).toBe("GIBB")
    expect(modell!.modellId).toBe("mc-block-gibb")
    expect(modell!.lage.lat).toBeGreaterThan(46.95)
    expect(modell!.lage.lng).toBeGreaterThan(7.44)
    expect(modell!.textur).toMatch(/\/bloecke\//)
  })

  it("places every catalogued sight with its own model id", () => {
    const modelle = listSichtModelle()
    const ids = new Set(modelle.map((modell) => modell.modellId))
    expect(ids.size).toBe(modelle.length)
    expect(modelle.length).toBeGreaterThanOrEqual(4)
  })
})
