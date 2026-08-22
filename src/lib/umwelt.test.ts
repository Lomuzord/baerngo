import { describe, expect, it } from "vitest"
import {
  poolFuerUmwelt,
  spawnErlaubt,
  spawnFuerUmwelt,
  umweltAusMerkmalen,
} from "./umwelt"

describe("umweltAusMerkmalen", () => {
  it("prefers ground use over labels and rooftops", () => {
    expect(
      umweltAusMerkmalen([{ layerId: "waterway-label", typ: "symbol" }, { layerId: "landuse", klasse: "park" }]),
    ).toBe("park")
    expect(umweltAusMerkmalen([{ layerId: "water", typ: "fill" }])).toBe("wasser")
    expect(
      umweltAusMerkmalen([{ layerId: "minecraft-buildings", typ: "fill-extrusion" }]),
    ).toBe("stadt")
    expect(umweltAusMerkmalen([{ layerId: "road-simple", typ: "line" }])).toBe(
      "strasse",
    )
    expect(umweltAusMerkmalen([])).toBe("unbekannt")
    expect(
      umweltAusMerkmalen([
        { layerId: "road-simple", typ: "line" },
        { layerId: "landuse", klasse: "park" },
      ]),
    ).toBe("park")
    expect(
      umweltAusMerkmalen([{ layerId: "landcover", klasse: "wood" }]),
    ).toBe("wald")
  })
})

describe("spawnFuerUmwelt", () => {
  it("keeps the river out of the walk ring but still uses city ground", () => {
    expect(spawnErlaubt("wasser")).toBe(false)
    expect(spawnErlaubt("stadt")).toBe(true)
    expect(spawnErlaubt("park")).toBe(true)
    expect(spawnErlaubt("strasse")).toBe(true)
    expect(poolFuerUmwelt("park")).toEqual([
      "laub",
      "laub",
      "stamm",
      "gras",
      "moosstein",
    ])
    expect(poolFuerUmwelt("feld")[0]).toBe("gras")
    expect(poolFuerUmwelt("feld")).toContain("erde")
    expect(poolFuerUmwelt("strasse")).toEqual([
      "stein",
      "kies",
      "andesit",
      "golderz",
    ])
    expect(spawnFuerUmwelt("park", () => 0)).toBe("laub")
    expect(spawnFuerUmwelt("unbekannt", () => 0)).not.toBe("erde")
    expect(new Set(poolFuerUmwelt("unbekannt")).size).toBeGreaterThan(6)
  })
})
