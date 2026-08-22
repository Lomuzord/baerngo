import { describe, expect, it } from "vitest"
import { meshFuerSehenswuerdigkeit } from "./modelle"

describe("meshFuerSehenswuerdigkeit", () => {
  it("uses the voxel bear park at the Bärengraben", () => {
    const mesh = meshFuerSehenswuerdigkeit("baerengraben")
    expect(mesh?.src).toBe("/modelle/baerengraben.glb")
    expect(mesh?.format).toBe("gltf")
  })

  it("uses the voxel Bundeshaus with the dome", () => {
    const mesh = meshFuerSehenswuerdigkeit("bundeshaus")
    expect(mesh?.src).toBe("/modelle/bundeshaus.glb")
    expect(mesh?.format).toBe("gltf")
  })

  it("gives every catalogued sight a 3D model", async () => {
    const { listSehenswuerdigkeiten } = await import("./katalog")
    for (const eintrag of listSehenswuerdigkeiten()) {
      const mesh = meshFuerSehenswuerdigkeit(eintrag.id)
      expect(mesh, eintrag.id).toBeDefined()
      expect(["collada", "gltf"]).toContain(mesh!.format)
    }
  })

  it("leaves unknown sights without a mesh", () => {
    expect(meshFuerSehenswuerdigkeit("nicht-da")).toBeUndefined()
  })
})
