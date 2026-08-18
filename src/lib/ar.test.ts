import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  glbFuerGegenstand,
  kannSceneViewer,
  modelViewerArModi,
  sceneViewerUrl,
} from "./ar"

describe("sceneViewerUrl", () => {
  it("builds a Scene Viewer intent for the served block glTF", () => {
    const glb = glbFuerGegenstand("pickel")
    expect(glb).toBe("/modelle/block.glb")
    expect(
      existsSync(join(process.cwd(), "public", glb.replace(/^\//, ""))),
    ).toBe(true)

    const url = sceneViewerUrl("https://baerngo.example/modelle/block.glb", "Spitzhacke")
    expect(url).toContain("arvr.google.com/scene-viewer")
    expect(url).toContain("mode=ar_preferred")
    expect(url).toContain("com.google.ar.core")
    expect(url).toContain(encodeURIComponent("https://baerngo.example/modelle/block.glb"))
    expect(modelViewerArModi()).toContain("scene-viewer")
    expect(kannSceneViewer("https://baerngo.example")).toBe(true)
    expect(kannSceneViewer("http://localhost:3000")).toBe(false)
  })
})
