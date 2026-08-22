import { describe, expect, it } from "vitest"
import { sehenswuerdigkeitById } from "./katalog"
import {
  blickAusWeg,
  distanzMeter,
  entfernungText,
  istInReichweite,
  istNahGenug,
  kreisUm,
  lageVersetzt,
  naechsterBlick,
} from "./reichweite"

describe("istInReichweite", () => {
  it("unlocks the quiz when the player is at the Zytglogge", () => {
    const zytglogge = sehenswuerdigkeitById("zytglogge")
    expect(zytglogge).toBeDefined()
    const reichweite = istInReichweite(zytglogge!.lage, "zytglogge")
    expect(reichweite.erlaubt).toBe(true)
    expect(reichweite.distanzMeter).toBeLessThan(1)
  })

  it("keeps the quiz locked when the player is far from Bern", () => {
    const reichweite = istInReichweite({ lat: 0, lng: 0 }, "zytglogge")
    expect(reichweite.erlaubt).toBe(false)
    expect(reichweite.distanzMeter).toBeGreaterThan(1_000)
  })
})

describe("lageVersetzt", () => {
  it("moves a few dozen metres north without leaving Bern", () => {
    const start = { lat: 46.948, lng: 7.447 }
    const nord = lageVersetzt(start, 40, 0)
    expect(nord.lat).toBeGreaterThan(start.lat)
    expect(istNahGenug(start, nord, 45)).toBe(true)
    expect(istNahGenug(start, nord, 20)).toBe(false)
  })
})

describe("kreisUm", () => {
  it("builds a closed walking disk of the given radius", () => {
    const mitte = { lat: 46.948, lng: 7.447 }
    const ring = kreisUm(mitte, 40)
    expect(ring.length).toBe(48)
    for (const punkt of ring) {
      expect(Math.abs(distanzMeter(mitte, punkt) - 40)).toBeLessThan(2)
    }
  })
})

describe("blickAusWeg", () => {
  it("points north when the next fix is further north", () => {
    const start = { lat: 46.948, lng: 7.447 }
    expect(blickAusWeg(start, lageVersetzt(start, 40, 0))).toBeCloseTo(0, 0)
    expect(blickAusWeg(start, lageVersetzt(start, 0, 40))).toBeCloseTo(90, 0)
  })
})

describe("naechsterBlick", () => {
  it("turns from the walk path after a few metres, not from a still compass", () => {
    const start = { lat: 46.948, lng: 7.447 }
    const still = naechsterBlick({
      bisher: 10,
      von: start,
      nach: lageVersetzt(start, 0.4, 0),
      geraet: 90,
      geschwindigkeit: 0,
    })
    expect(still.schritt).toBe(false)
    expect(still.blick).toBe(10)
    const schritt = naechsterBlick({
      von: start,
      nach: lageVersetzt(start, 0, 40),
      genauigkeit: 8,
    })
    expect(schritt.schritt).toBe(true)
    expect(schritt.blick).toBeCloseTo(90, 0)
  })
})

describe("entfernungText", () => {
  it("shows metres nearby and kilometres farther away", () => {
    expect(entfernungText(42)).toBe("42 m")
    expect(entfernungText(2450)).toBe("2.5 km")
    expect(entfernungText(Number.POSITIVE_INFINITY)).toBe("unbekannt")
  })
})
