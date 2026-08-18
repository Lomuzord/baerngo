type FarbLayer = {
  setPaintProperty: (id: string, prop: string, value: unknown) => void
  getStyle: () => { layers?: { id: string; type: string }[] }
}

export function applyMinecraftLook(map: FarbLayer) {
  const layers = map.getStyle().layers ?? []
  for (const layer of layers) {
    const id = layer.id
    try {
      if (layer.type === "background") {
        map.setPaintProperty(id, "background-color", "#7ec850")
      }
      if (id.includes("park") || id.includes("landuse") || id.includes("national-park")) {
        map.setPaintProperty(id, "fill-color", "#5b8c3a")
      }
      if (id.includes("water") && layer.type === "fill") {
        map.setPaintProperty(id, "fill-color", "#3d91e0")
      }
      if (id.startsWith("road") && layer.type === "line") {
        map.setPaintProperty(id, "line-color", "#8b6914")
      }
      if (id.includes("building") && layer.type === "fill") {
        map.setPaintProperty(id, "fill-color", "#c2a06a")
        map.setPaintProperty(id, "fill-opacity", 0)
      }
    } catch {
      // Layer paint props vary; skip unsupported ones.
    }
  }
}

export const MINECRAFT_GEBAEUDE = {
  id: "minecraft-buildings",
  source: "composite",
  "source-layer": "building",
  filter: ["==", ["get", "extrude"], "true"],
  type: "fill-extrusion" as const,
  minzoom: 14,
  paint: {
    "fill-extrusion-color": [
      "case",
      [">=", ["get", "height"], 40],
      "#7d7d7d",
      [">=", ["get", "height"], 16],
      "#c2a06a",
      "#8b5a2b",
    ],
    "fill-extrusion-height": ["coalesce", ["get", "height"], 10],
    "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
    "fill-extrusion-opacity": 0.98,
  },
}
