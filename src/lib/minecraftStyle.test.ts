import { describe, expect, it } from "vitest"
import { applyMinecraftLook, MINECRAFT_GEBAEUDE } from "./minecraftStyle"

describe("applyMinecraftLook", () => {
  it("recolors road, park, and water layers on the shipped style helper", () => {
    const paints: { id: string; prop: string; value: unknown }[] = []
    applyMinecraftLook({
      getStyle: () => ({
        layers: [
          { id: "background", type: "background" },
          { id: "landuse-park", type: "fill" },
          { id: "water", type: "fill" },
          { id: "road-street", type: "line" },
          { id: "building", type: "fill" },
        ],
      }),
      setPaintProperty: (id, prop, value) => {
        paints.push({ id, prop, value })
      },
    })
    expect(paints.some((p) => p.id === "road-street" && p.value === "#8b6914")).toBe(
      true,
    )
    expect(paints.some((p) => p.id === "water" && p.value === "#3d91e0")).toBe(true)
    expect(MINECRAFT_GEBAEUDE.type).toBe("fill-extrusion")
    expect(MINECRAFT_GEBAEUDE["source-layer"]).toBe("building")
  })
})
