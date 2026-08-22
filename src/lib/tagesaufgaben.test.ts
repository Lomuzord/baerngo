import { describe, expect, it } from "vitest"
import {
  alleGeschafft,
  aufgabenFuer,
  fertigAnzahl,
  heutigesDatum,
  meldeEreignis,
  parseTagesStand,
} from "./tagesaufgaben"

describe("aufgabenFuer", () => {
  it("is deterministic per date and differs between dates", () => {
    const a = aufgabenFuer("2026-08-23")
    const b = aufgabenFuer("2026-08-23")
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id))
    expect(a).toHaveLength(3)
    expect(new Set(a.map((x) => x.id)).size).toBe(3)
    const woanders = [
      aufgabenFuer("2026-08-24"),
      aufgabenFuer("2026-08-25"),
      aufgabenFuer("2026-08-26"),
    ].map((tag) => tag.map((x) => x.id).join(","))
    // Nicht jeder Tag muss anders sein, aber irgendeiner schon
    expect(new Set([a.map((x) => x.id).join(","), ...woanders]).size)
      .toBeGreaterThan(1)
  })
})

describe("meldeEreignis & Fortschritt", () => {
  const aufgaben = [
    { id: "sammeln-stein", text: "", art: "sammeln" as const, ziel: 10, zielId: "stein" },
    { id: "truhen", text: "", art: "truhe" as const, ziel: 2 },
    { id: "wandern", text: "", art: "meter" as const, ziel: 1000 },
  ]

  it("counts matching events, caps at the goal, ignores others", () => {
    let stand = parseTagesStand(null, "2026-08-23")
    stand = meldeEreignis(stand, aufgaben, "sammeln", 4, "stein")
    stand = meldeEreignis(stand, aufgaben, "sammeln", 4, "gras")
    expect(stand.zaehler["sammeln-stein"]).toBe(4)
    stand = meldeEreignis(stand, aufgaben, "sammeln", 99, "stein")
    expect(stand.zaehler["sammeln-stein"]).toBe(10)
    stand = meldeEreignis(stand, aufgaben, "truhe", 1)
    stand = meldeEreignis(stand, aufgaben, "meter", 600)
    expect(fertigAnzahl(aufgaben, stand)).toBe(1)
    expect(alleGeschafft(aufgaben, stand)).toBe(false)
    stand = meldeEreignis(stand, aufgaben, "truhe", 1)
    stand = meldeEreignis(stand, aufgaben, "meter", 500)
    expect(alleGeschafft(aufgaben, stand)).toBe(true)
  })

  it("resets on a new day and parses defensively", () => {
    const alt = { datum: "2026-08-22", zaehler: { truhen: 2 }, belohnt: true }
    const neu = parseTagesStand(alt, "2026-08-23")
    expect(neu).toEqual({ datum: "2026-08-23", zaehler: {}, belohnt: false })
    expect(parseTagesStand("müll", "2026-08-23").zaehler).toEqual({})
    expect(heutigesDatum(new Date(2026, 7, 23))).toBe("2026-08-23")
  })
})
