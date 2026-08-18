import { describe, expect, it } from "vitest"
import {
  BLOCK_KANTE_METER,
  innerhalbPlatte,
  rasterAufEbene,
  setzPose,
  type Ebene,
} from "./spielflaeche"

const ebene: Ebene = { ursprung: { x: 0, y: 0, z: -1 } }

describe("rasterAufEbene", () => {
  it("snaps a hit onto the play-plate grid like Minecraft Earth", () => {
    const zelle = rasterAufEbene({ x: 0.09, y: 0.4, z: -0.95 }, ebene)
    expect(zelle.x).toBeCloseTo(BLOCK_KANTE_METER, 5)
    expect(zelle.z).toBeCloseTo(-1, 5)
    expect(zelle.y).toBe(0)
    expect(innerhalbPlatte(zelle, ebene)).toBe(true)
  })
})

describe("setzPose", () => {
  it("stacks the next block on the same cell and rejects a full overlap", () => {
    const erste = setzPose({ x: 0.01, y: 0, z: -1.01 }, ebene, [])
    expect(erste).toEqual({ x: 0, y: 0, z: -1 })
    const zweite = setzPose({ x: 0.02, y: 0.05, z: -1 }, ebene, [erste!])
    expect(zweite?.x).toBe(0)
    expect(zweite?.z).toBe(-1)
    expect(zweite?.y).toBeCloseTo(BLOCK_KANTE_METER, 5)
    expect(setzPose({ x: 0, y: 0, z: -1 }, ebene, [erste!, zweite!])).not.toEqual(
      erste,
    )
  })

  it("refuses a hit outside the play plate", () => {
    expect(
      setzPose({ x: 4, y: 0, z: -1 }, ebene, []),
    ).toBeNull()
  })
})
