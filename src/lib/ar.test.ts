import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  glbFuerGegenstand,
  kannSceneViewer,
  modelViewerArModi,
  ndcVonViewport,
  sceneViewerUrl,
  xrViewportFeld,
  webXrFeatures,
  webXrModus,
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

describe("ndcVonViewport", () => {
  it("maps a canvas tap to NDC, including a letterboxed XR viewport", () => {
    const css = { left: 0, top: 0, width: 100, height: 100 }
    const buffer = { width: 100, height: 100 }
    expect(ndcVonViewport(50, 50, css, buffer)).toEqual({ x: 0, y: 0 })
    expect(ndcVonViewport(0, 0, css, buffer)).toEqual({ x: -1, y: 1 })
    expect(ndcVonViewport(100, 100, css, buffer)).toEqual({ x: 1, y: -1 })
    expect(
      ndcVonViewport(50, 50, css, buffer, {
        x: 10,
        y: 10,
        width: 80,
        height: 80,
      }),
    ).toEqual({ x: 0, y: 0 })
    expect(xrViewportFeld({ x: 10, y: 10, z: 80, w: 80 })).toEqual({
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    })
  })
})

describe("webXrModus", () => {
  it("asks for immersive-ar with hit-test so ARCore Chrome can place blocks", () => {
    expect(webXrModus()).toBe("immersive-ar")
    expect(webXrFeatures()).toContain("hit-test")
    expect(webXrFeatures()).toContain("local-floor")
  })
})
