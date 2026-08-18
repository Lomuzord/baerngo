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
})
