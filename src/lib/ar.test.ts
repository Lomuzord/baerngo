import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  glbFuerGegenstand,
  kannSceneViewer,
  modelViewerArModi,
  ndcVonViewport,
  plattenOrtOhneFlaeche,
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

describe("plattenOrtOhneFlaeche", () => {
  const kamera = { x: 0, y: 1.5, z: 0 }
  const richtung = (y: number, z: number) => {
    const l = Math.hypot(y, z)
    return { x: 0, y: y / l, z: z / l }
  }

  it("keeps the tapped floor point when it is within reach", () => {
    const treffer = { x: 0, y: 0, z: -1.5 }
    expect(plattenOrtOhneFlaeche(kamera, richtung(-1, -1), treffer, false)).toBe(
      treffer,
    )
  })

  it("pulls a far floor hit from a nearly level phone back into view", () => {
    const ort = plattenOrtOhneFlaeche(
      kamera,
      richtung(-0.05, -1),
      { x: 0, y: 0, z: -30 },
      false,
    )
    expect(ort).toEqual({ x: 0, y: 0, z: -3 })
    expect(
      plattenOrtOhneFlaeche(kamera, richtung(-0.05, -1), null, true).z,
    ).toBeCloseTo(-4)
  })

  it("still places the plate when the phone points level or upwards", () => {
    const ort = plattenOrtOhneFlaeche(kamera, richtung(0.2, -1), null, false)
    expect(ort.y).toBe(0)
    expect(ort.z).toBeCloseTo(-3)
  })

  it("assumes chest height when local-floor sits at the phone", () => {
    const ort = plattenOrtOhneFlaeche(
      { x: 1, y: 0.1, z: 2 },
      richtung(-1, -1),
      { x: 1, y: 0, z: 1.9 },
      false,
    )
    expect(ort.y).toBeCloseTo(-1.2)
    expect(ort.x).toBeCloseTo(1)
    expect(ort.z).toBeCloseTo(2 - 1.3)
  })

  it("puts the plate straight below when looking down", () => {
    expect(
      plattenOrtOhneFlaeche(kamera, { x: 0, y: -1, z: 0 }, null, false),
    ).toEqual({ x: 0, y: 0, z: 0 })
  })
})

describe("webXrModus", () => {
  it("asks for immersive-ar with hit-test so ARCore Chrome can place blocks", () => {
    expect(webXrModus()).toBe("immersive-ar")
    expect(webXrFeatures()).toContain("hit-test")
    expect(webXrFeatures()).toContain("local-floor")
  })
})
