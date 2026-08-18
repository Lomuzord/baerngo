import { describe, expect, it } from "vitest"
import { craft, ergebnisFuerRaster, nimmCraft } from "./werkbank"

describe("craft", () => {
  it("turns two gold into a gold block through the werkbank owner", () => {
    const ergebnis = craft({ gold: 2, honig: 1 }, "goldblock")
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.ergebnis.id).toBe("goldblock")
    expect(ergebnis.inventar.goldblock).toBe(1)
    expect(ergebnis.inventar.gold).toBeUndefined()
    expect(ergebnis.inventar.honig).toBe(1)
  })

  it("refuses a recipe when a material is missing", () => {
    const ergebnis = craft({ gold: 1 }, "goldblock")
    expect(ergebnis).toEqual({ ok: false, grund: "Zu wenig Material" })
  })

  it("reads a 3x3 grid the way the Werkbank UI does", () => {
    const raster = [
      "gold",
      null,
      "gold",
      null,
      null,
      null,
      null,
      null,
      null,
    ]
    expect(ergebnisFuerRaster(raster)?.id).toBe("goldblock")
    expect(ergebnisFuerRaster(Array(9).fill(null))).toBeNull()

    const genommen = nimmCraft({ honig: 1 }, raster)
    expect(genommen.ok).toBe(true)
    if (!genommen.ok) return
    expect(genommen.ergebnis.id).toBe("goldblock")
    expect(genommen.inventar.goldblock).toBe(1)
    expect(genommen.raster.every((zelle) => zelle === null)).toBe(true)
  })

  it("crafts a pickaxe from the T-shape and refuses the same counts out of shape", () => {
    const pickelRaster = [
      "stein",
      "stein",
      "stein",
      null,
      "holz",
      null,
      null,
      "holz",
      null,
    ]
    expect(ergebnisFuerRaster(pickelRaster)?.id).toBe("pickel")
    const genommen = nimmCraft({ honig: 1 }, pickelRaster)
    expect(genommen.ok).toBe(true)
    if (!genommen.ok) return
    expect(genommen.ergebnis.id).toBe("pickel")
    expect(genommen.inventar.pickel).toBe(1)
    expect(genommen.inventar.honig).toBe(1)

    const falsch = [
      "stein",
      "holz",
      "stein",
      "holz",
      "stein",
      null,
      null,
      null,
      null,
    ]
    expect(ergebnisFuerRaster(falsch)).toBeNull()
    expect(nimmCraft({}, falsch)).toEqual({ ok: false, grund: "Kein Rezept" })
  })

  it("crafts a sword from the upright blade shape", () => {
    const schwertRaster = [
      null,
      "gold",
      null,
      null,
      "gold",
      null,
      null,
      "holz",
      null,
    ]
    expect(ergebnisFuerRaster(schwertRaster)?.id).toBe("schwert")
    const genommen = nimmCraft({}, schwertRaster)
    expect(genommen.ok).toBe(true)
    if (!genommen.ok) return
    expect(genommen.ergebnis.id).toBe("schwert")
  })
})
