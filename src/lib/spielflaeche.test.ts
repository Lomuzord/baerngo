import { describe, expect, it } from "vitest"
import {
  BLOCK_KANTE_METER,
  PLATTE_MAX_HOEHE,
  innerhalbPlatte,
  naechsteZelle,
  poseVonZelle,
  rasterAufEbene,
  setzPose,
  flaecheVonPunkt,
  zelleAnFlaeche,
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

describe("naechsteZelle", () => {
  it("stacks cell indices on the plate and stops at the height cap", () => {
    const erste = naechsteZelle({ x: 0.01, y: 0, z: -1.01 }, ebene, [])
    expect(erste).toEqual({ ix: 0, iy: 0, iz: 0 })
    const zweite = naechsteZelle({ x: 0, y: 0, z: -1 }, ebene, [erste!])
    expect(zweite).toEqual({ ix: 0, iy: 1, iz: 0 })
    expect(poseVonZelle(zweite!, ebene).y).toBeCloseTo(BLOCK_KANTE_METER, 5)

    const voll: { ix: number; iy: number; iz: number }[] = []
    for (let iy = 0; iy < PLATTE_MAX_HOEHE; iy++) {
      voll.push({ ix: 0, iy, iz: 0 })
    }
    expect(naechsteZelle({ x: 0, y: 0, z: -1 }, ebene, voll)).toBeNull()
  })
})

describe("zelleAnFlaeche", () => {
  const basis = { ix: 0, iy: 0, iz: 0 }

  it("places on the empty plate cell under a tap", () => {
    expect(
      zelleAnFlaeche({ punkt: { x: 0.01, y: 0, z: -1.01 } }, ebene, []),
    ).toEqual(basis)
  })

  it("attaches to the tapped face like Minecraft Earth", () => {
    expect(
      zelleAnFlaeche({ zelle: basis, normale: { x: 0, y: 1, z: 0 } }, ebene, [
        basis,
      ]),
    ).toEqual({ ix: 0, iy: 1, iz: 0 })
    expect(
      zelleAnFlaeche({ zelle: basis, normale: { x: 1, y: 0, z: 0 } }, ebene, [
        basis,
      ]),
    ).toEqual({ ix: 1, iy: 0, iz: 0 })
    expect(
      zelleAnFlaeche({ zelle: basis, normale: { x: 0, y: 0, z: -1 } }, ebene, [
        basis,
      ]),
    ).toEqual({ ix: 0, iy: 0, iz: -1 })
  })

  it("refuses an occupied face, the plate floor, and a cell below the plate", () => {
    const nachbar = { ix: 1, iy: 0, iz: 0 }
    expect(
      zelleAnFlaeche({ zelle: basis, normale: { x: 1, y: 0, z: 0 } }, ebene, [
        basis,
        nachbar,
      ]),
    ).toBeNull()
    expect(
      zelleAnFlaeche({ punkt: { x: 0, y: 0, z: -1 } }, ebene, [basis]),
    ).toBeNull()
    expect(
      zelleAnFlaeche({ zelle: basis, normale: { x: 0, y: -1, z: 0 } }, ebene, [
        basis,
      ]),
    ).toBeNull()
  })
})

describe("flaecheVonPunkt", () => {
  const mitte = { x: 0, y: 0, z: 0 }

  it("reads the whole top face as top so blocks stack like Minecraft", () => {
    expect(flaecheVonPunkt(mitte, { x: 0, y: 0.08, z: 0 }, 0.16)).toEqual({
      x: 0,
      y: 1,
      z: 0,
    })
    // Treffer auf der Oberseite nahe der Kante gehört immer noch zur
    // Oberseite — sonst landet der Block in der Nachbarspalte.
    expect(flaecheVonPunkt(mitte, { x: 0.07, y: 0.08, z: 0 }, 0.16)).toEqual({
      x: 0,
      y: 1,
      z: 0,
    })
    expect(flaecheVonPunkt(mitte, { x: 0.08, y: 0.05, z: 0 }, 0.16)).toEqual({
      x: 1,
      y: 0,
      z: 0,
    })
    expect(flaecheVonPunkt(mitte, { x: 0.02, y: -0.08, z: 0.03 }, 0.16)).toEqual({
      x: 0,
      y: -1,
      z: 0,
    })
    expect(flaecheVonPunkt(mitte, { x: 0.01, y: 0.02, z: -0.08 }, 0.16)).toEqual({
      x: 0,
      y: 0,
      z: -1,
    })
  })
})
