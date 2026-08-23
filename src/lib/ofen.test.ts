import { describe, expect, it } from "vitest"
import {
  brennwertMs,
  klickOfen,
  leererOfen,
  SCHMELZ_DAUER_MS,
  schmelzrezeptFuer,
  tickOfen,
  type OfenStand,
} from "./ofen"

describe("tickOfen", () => {
  it("smelts one sand into glass after 10 seconds of coal fire", () => {
    expect(schmelzrezeptFuer("sand")?.ausgabe).toBe("glas")
    let stand: OfenStand = {
      eingabe: { id: "sand", anzahl: 2 },
      brennstoff: { id: "kohle", anzahl: 1 },
      ausgabe: null,
    }
    stand = tickOfen(stand, SCHMELZ_DAUER_MS / 2)
    expect(stand.ausgabe).toBeNull()
    expect(stand.brennstoff).toBeNull() // Kohle ist angezündet
    expect(stand.brandRestMs).toBeGreaterThan(0)
    stand = tickOfen(stand, SCHMELZ_DAUER_MS / 2)
    expect(stand.ausgabe).toEqual({ id: "glas", anzahl: 1 })
    expect(stand.eingabe).toEqual({ id: "sand", anzahl: 1 })
  })

  it("one coal smelts 8 items like Minecraft", () => {
    let stand: OfenStand = {
      eingabe: { id: "sand", anzahl: 10 },
      brennstoff: { id: "kohle", anzahl: 1 },
      ausgabe: null,
    }
    stand = tickOfen(stand, 8 * SCHMELZ_DAUER_MS)
    expect(stand.ausgabe).toEqual({ id: "glas", anzahl: 8 })
    expect(stand.eingabe).toEqual({ id: "sand", anzahl: 2 })
    // Feuer ist aus, das neunte Stück kommt nicht mehr
    stand = tickOfen(stand, 5 * SCHMELZ_DAUER_MS)
    expect(stand.ausgabe?.anzahl).toBe(8)
  })

  it("planks burn 1.5 smelts, a stick only half", () => {
    expect(brennwertMs("holz")).toBe(1.5 * SCHMELZ_DAUER_MS)
    expect(brennwertMs("stock")).toBe(0.5 * SCHMELZ_DAUER_MS)
    expect(brennwertMs("kohle")).toBe(8 * SCHMELZ_DAUER_MS)
    // Ein Stock allein bringt kein Stück fertig …
    let stand: OfenStand = {
      eingabe: { id: "sand", anzahl: 1 },
      brennstoff: { id: "stock", anzahl: 1 },
      ausgabe: null,
    }
    stand = tickOfen(stand, 2 * SCHMELZ_DAUER_MS)
    expect(stand.ausgabe).toBeNull()
    // … zwei Stöcke schon
    let voll: OfenStand = {
      eingabe: { id: "sand", anzahl: 1 },
      brennstoff: { id: "stock", anzahl: 2 },
      ausgabe: null,
    }
    voll = tickOfen(voll, SCHMELZ_DAUER_MS + 1)
    expect(voll.ausgabe).toEqual({ id: "glas", anzahl: 1 })
  })

  it("does not light fuel with nothing to smelt, and progress decays without fire", () => {
    let leerlauf: OfenStand = {
      eingabe: null,
      brennstoff: { id: "kohle", anzahl: 3 },
      ausgabe: null,
    }
    leerlauf = tickOfen(leerlauf, 60_000)
    expect(leerlauf.brennstoff).toEqual({ id: "kohle", anzahl: 3 })

    // Halb geschmolzen, Feuer aus → Fortschritt fällt zurück
    let abkuehlung: OfenStand = {
      eingabe: { id: "sand", anzahl: 1 },
      brennstoff: null,
      ausgabe: null,
      brandRestMs: 0,
      schmelzMs: SCHMELZ_DAUER_MS / 2,
    }
    abkuehlung = tickOfen(abkuehlung, 2_000)
    expect(abkuehlung.schmelzMs).toBe(SCHMELZ_DAUER_MS / 2 - 4_000)
    expect(abkuehlung.ausgabe).toBeNull()
  })

  it("stacks output and stalls when the output would overflow", () => {
    let stand: OfenStand = {
      eingabe: { id: "redstoneerz", anzahl: 2 },
      brennstoff: { id: "kohle", anzahl: 1 },
      ausgabe: null,
    }
    stand = tickOfen(stand, 2 * SCHMELZ_DAUER_MS + 1)
    expect(stand.ausgabe).toEqual({ id: "redstone", anzahl: 6 })

    let voll: OfenStand = {
      eingabe: { id: "sand", anzahl: 1 },
      brennstoff: { id: "kohle", anzahl: 1 },
      ausgabe: { id: "glas", anzahl: 64 },
    }
    voll = tickOfen(voll, 5 * SCHMELZ_DAUER_MS)
    expect(voll.ausgabe?.anzahl).toBe(64)
    expect(voll.brennstoff).toEqual({ id: "kohle", anzahl: 1 })
  })
})

describe("klickOfen", () => {
  it("refuses non-fuel in the fuel slot even when fuel is already there", () => {
    const stand = {
      eingabe: null,
      brennstoff: { id: "kohle", anzahl: 32 },
      ausgabe: null,
    }
    const versuch = klickOfen(stand, "brennstoff", { id: "sand", anzahl: 3 })
    expect(versuch.stand.brennstoff).toEqual({ id: "kohle", anzahl: 32 })
    expect(versuch.cursor).toEqual({ id: "sand", anzahl: 3 })
  })

  it("caps furnace slot merges at the stack maximum", () => {
    const stand = {
      eingabe: { id: "sand", anzahl: 60 },
      brennstoff: null,
      ausgabe: null,
    }
    const dazu = klickOfen(stand, "eingabe", { id: "sand", anzahl: 10 })
    expect(dazu.stand.eingabe).toEqual({ id: "sand", anzahl: 64 })
    expect(dazu.cursor).toEqual({ id: "sand", anzahl: 6 })
  })

  it("lets you take the result", () => {
    const genommen = klickOfen(
      {
        eingabe: null,
        brennstoff: null,
        ausgabe: { id: "glas", anzahl: 1 },
      },
      "ausgabe",
      null,
    )
    expect(genommen.cursor).toEqual({ id: "glas", anzahl: 1 })
    expect(genommen.stand.ausgabe).toBeNull()
    expect(leererOfen().eingabe).toBeNull()
  })
})
