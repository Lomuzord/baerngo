import { describe, expect, it } from "vitest"
import { klickOfen, leererOfen, schmelzrezeptFuer, treibeOfen } from "./ofen"

describe("treibeOfen", () => {
  it("smelts sand with coal into glass and iron ore into iron", () => {
    expect(schmelzrezeptFuer("sand")?.ausgabe).toBe("glas")
    const glas = treibeOfen({
      eingabe: { id: "sand", anzahl: 2 },
      brennstoff: { id: "kohle", anzahl: 1 },
      ausgabe: null,
    })
    expect(glas.ausgabe).toEqual({ id: "glas", anzahl: 1 })
    expect(glas.eingabe).toEqual({ id: "sand", anzahl: 1 })
    expect(glas.brennstoff).toBeNull()

    const holzFeuer = treibeOfen({
      eingabe: { id: "sand", anzahl: 1 },
      brennstoff: { id: "holz", anzahl: 1 },
      ausgabe: null,
    })
    expect(holzFeuer.ausgabe).toEqual({ id: "glas", anzahl: 1 })

    const eisen = treibeOfen({
      eingabe: { id: "eisenerz", anzahl: 1 },
      brennstoff: { id: "stamm", anzahl: 1 },
      ausgabe: null,
    })
    expect(eisen.ausgabe).toEqual({ id: "eisen", anzahl: 1 })
    expect(eisen.eingabe).toBeNull()
  })

  it("smelts cobblestone back into stone", () => {
    expect(schmelzrezeptFuer("bruchstein")?.ausgabe).toBe("stein")
  })

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

  it("does not smelt without fuel and lets you take the result", () => {
    const kalt = treibeOfen({
      eingabe: { id: "sand", anzahl: 1 },
      brennstoff: null,
      ausgabe: null,
    })
    expect(kalt.ausgabe).toBeNull()
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
