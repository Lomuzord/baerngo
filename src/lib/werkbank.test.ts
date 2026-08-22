import { describe, expect, it } from "vitest"
import {
  craft,
  ergebnisFuerRaster,
  fehlendeZutaten,
  kannRezept,
  klickRaster,
  leeresRaster,
  legeRezept,
  nimmCraft,
  rasterAusIds,
} from "./werkbank"

describe("craft", () => {
  it("turns nine gold into a gold block like original Minecraft", () => {
    const ergebnis = craft({ gold: 9, honig: 1 }, "goldblock")
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.ergebnis.id).toBe("goldblock")
    expect(ergebnis.inventar.goldblock).toBe(1)
    expect(ergebnis.inventar.gold).toBeUndefined()
    expect(ergebnis.inventar.honig).toBe(1)
  })

  it("refuses a recipe when a material is missing", () => {
    const ergebnis = craft({ gold: 8 }, "goldblock")
    expect(ergebnis).toEqual({ ok: false, grund: "Zu wenig Material" })
  })

  it("reads a 3x3 grid the way the Werkbank UI does", () => {
    const raster = rasterAusIds(Array(9).fill("gold"))
    expect(ergebnisFuerRaster(raster)?.id).toBe("goldblock")
    expect(ergebnisFuerRaster(leeresRaster())).toBeNull()

    const genommen = nimmCraft(raster)
    expect(genommen.ok).toBe(true)
    if (!genommen.ok) return
    expect(genommen.ergebnis.id).toBe("goldblock")
    expect(genommen.anzahl).toBe(1)
    expect(genommen.raster.every((zelle) => zelle === null)).toBe(true)
  })

  it("consumes one item per cell so stacked cells craft repeatedly", () => {
    const raster = leeresRaster()
    raster[1] = { id: "holz", anzahl: 3 }
    raster[4] = { id: "holz", anzahl: 3 }
    expect(ergebnisFuerRaster(raster)?.id).toBe("stock")
    const erste = nimmCraft(raster)
    expect(erste.ok).toBe(true)
    if (!erste.ok) return
    expect(erste.anzahl).toBe(4)
    expect(erste.raster[1]).toEqual({ id: "holz", anzahl: 2 })
    expect(erste.raster[4]).toEqual({ id: "holz", anzahl: 2 })
    // Das Layout gilt weiter — direkt noch einmal craften
    expect(ergebnisFuerRaster(erste.raster)?.id).toBe("stock")
  })

  it("ignores stack height when matching a recipe", () => {
    const raster = leeresRaster()
    raster[4] = { id: "stamm", anzahl: 5 }
    expect(ergebnisFuerRaster(raster)?.id).toBe("holz")
    // Neun Zellen mit je 2 Gold sind trotzdem das Goldblock-Layout
    const voll = rasterAusIds(Array(9).fill("gold")).map((zelle) =>
      zelle ? { id: zelle.id, anzahl: 2 } : null,
    )
    expect(ergebnisFuerRaster(voll)?.id).toBe("goldblock")
  })

  it("turns a gold block back into nine gold", () => {
    const raster = rasterAusIds([
      null,
      null,
      null,
      null,
      "goldblock",
      null,
      null,
      null,
      null,
    ])
    expect(ergebnisFuerRaster(raster)?.id).toBe("gold")
    const genommen = nimmCraft(raster)
    expect(genommen.ok).toBe(true)
    if (genommen.ok) expect(genommen.anzahl).toBe(9)
  })

  it("crafts sticks, a werkbank, sandstone, and all pickaxe tiers", () => {
    expect(
      ergebnisFuerRaster(
        rasterAusIds([
          null,
          "holz",
          null,
          null,
          "holz",
          null,
          null,
          null,
          null,
        ]),
      )?.id,
    ).toBe("stock")
    expect(
      ergebnisFuerRaster(
        rasterAusIds([
          "holz",
          "holz",
          null,
          "holz",
          "holz",
          null,
          null,
          null,
          null,
        ]),
      )?.id,
    ).toBe("werkbank")
    expect(
      ergebnisFuerRaster(
        rasterAusIds([
          null,
          null,
          null,
          null,
          "sand",
          "sand",
          null,
          "sand",
          "sand",
        ]),
      )?.id,
    ).toBe("sandstein")
    for (const [material, pickel] of [
      ["holz", "holzpickel"],
      ["stein", "pickel"],
      ["eisen", "eisenpickel"],
      ["diamant", "diamantpickel"],
    ] as const) {
      expect(
        ergebnisFuerRaster(
          rasterAusIds([
            material,
            material,
            material,
            null,
            "stock",
            null,
            null,
            "stock",
            null,
          ]),
        )?.id,
        material,
      ).toBe(pickel)
    }
    expect(
      ergebnisFuerRaster(
        rasterAusIds([
          "stein",
          "stein",
          null,
          "stein",
          "stock",
          null,
          null,
          "stock",
          null,
        ]),
      )?.id,
    ).toBe("axt")
    expect(
      ergebnisFuerRaster(
        rasterAusIds([
          "stein",
          "holz",
          "stein",
          "holz",
          "stein",
          null,
          null,
          null,
          null,
        ]),
      ),
    ).toBeNull()
  })

  it("crafts four torches from coal over a stick", () => {
    const raster = rasterAusIds([
      null,
      "kohle",
      null,
      null,
      "stock",
      null,
      null,
      null,
      null,
    ])
    expect(ergebnisFuerRaster(raster)?.id).toBe("fackel")
    const genommen = nimmCraft(raster)
    expect(genommen.ok).toBe(true)
    if (genommen.ok) expect(genommen.anzahl).toBe(4)
  })

  it("crafts a sword from the upright blade shape", () => {
    expect(
      ergebnisFuerRaster(
        rasterAusIds([
          null,
          "gold",
          null,
          null,
          "gold",
          null,
          null,
          "stock",
          null,
        ]),
      )?.id,
    ).toBe("schwert")
    expect(
      ergebnisFuerRaster(
        rasterAusIds([
          "gold",
          null,
          null,
          "gold",
          null,
          null,
          "stock",
          null,
          null,
        ]),
      )?.id,
    ).toBe("schwert")
  })
})

describe("klickRaster", () => {
  it("places the whole held stack and picks it back up", () => {
    const gelegt = klickRaster(leeresRaster(), 4, { id: "holz", anzahl: 3 })
    expect(gelegt.raster[4]).toEqual({ id: "holz", anzahl: 3 })
    expect(gelegt.cursor).toBeNull()
    const genommen = klickRaster(gelegt.raster, 4, null)
    expect(genommen.raster[4]).toBeNull()
    expect(genommen.cursor).toEqual({ id: "holz", anzahl: 3 })
  })

  it("merges same items up to the stack cap and swaps different ones", () => {
    const start = leeresRaster()
    start[0] = { id: "holz", anzahl: 62 }
    const dazu = klickRaster(start, 0, { id: "holz", anzahl: 5 })
    expect(dazu.raster[0]).toEqual({ id: "holz", anzahl: 64 })
    expect(dazu.cursor).toEqual({ id: "holz", anzahl: 3 })

    const tausch = klickRaster(start, 0, { id: "stein", anzahl: 4 })
    expect(tausch.raster[0]).toEqual({ id: "stein", anzahl: 4 })
    expect(tausch.cursor).toEqual({ id: "holz", anzahl: 62 })
  })

  it("places one item and picks half with the right-hand gesture", () => {
    const einzeln = klickRaster(
      leeresRaster(),
      2,
      { id: "sand", anzahl: 8 },
      "rechts",
    )
    expect(einzeln.raster[2]).toEqual({ id: "sand", anzahl: 1 })
    expect(einzeln.cursor).toEqual({ id: "sand", anzahl: 7 })

    const start = leeresRaster()
    start[5] = { id: "sand", anzahl: 9 }
    const halb = klickRaster(start, 5, null, "rechts")
    expect(halb.cursor).toEqual({ id: "sand", anzahl: 5 })
    expect(halb.raster[5]).toEqual({ id: "sand", anzahl: 4 })
  })
})

describe("legeRezept", () => {
  it("fills the 3x3 from a recipe like the Minecraft recipe book", () => {
    expect(kannRezept({ gold: 9 }, leeresRaster(), "goldblock")).toBe(true)
    expect(fehlendeZutaten({ gold: 1 }, leeresRaster(), "goldblock")).toEqual([
      { id: "gold", haben: 1, braucht: 9, fehlt: 8 },
    ])
    expect(fehlendeZutaten({ stein: 1 }, leeresRaster(), "pickel")).toEqual([
      { id: "stein", haben: 1, braucht: 3, fehlt: 2 },
      { id: "stock", haben: 0, braucht: 2, fehlt: 2 },
    ])
    const gelegt = legeRezept({ gold: 9, honig: 1 }, leeresRaster(), "goldblock")
    expect(gelegt.ok).toBe(true)
    if (!gelegt.ok) return
    expect(gelegt.inventar.gold).toBeUndefined()
    expect(gelegt.inventar.honig).toBe(1)
    expect(ergebnisFuerRaster(gelegt.raster)?.id).toBe("goldblock")

    const pickel = legeRezept({ stein: 3, stock: 2 }, leeresRaster(), "pickel")
    expect(pickel.ok).toBe(true)
    if (!pickel.ok) return
    expect(pickel.raster).toEqual(
      rasterAusIds([
        "stein",
        "stein",
        "stein",
        null,
        "stock",
        null,
        null,
        "stock",
        null,
      ]),
    )
    const ofen = legeRezept({ stein: 8 }, leeresRaster(), "ofen")
    expect(ofen.ok).toBe(true)
    if (ofen.ok) expect(ergebnisFuerRaster(ofen.raster)?.id).toBe("ofen")
    expect(kannRezept({ holz: 2 }, leeresRaster(), "stock")).toBe(true)
    expect(legeRezept({ gold: 1 }, leeresRaster(), "goldblock")).toEqual({
      ok: false,
      grund: "Zu wenig Material",
    })
  })
})
