import { describe, expect, it } from "vitest"
import { bewerteAntwort } from "./bewertung"
import { sehenswuerdigkeitById } from "./katalog"

describe("bewerteAntwort", () => {
  it("marks a matching Zytglogge answer correct and a non-matching one incorrect", () => {
    expect(
      bewerteAntwort("zytglogge", "Astronomische Uhr und Glockenspiel").korrekt,
    ).toBe(true)
    expect(
      bewerteAntwort("zytglogge", "Der höchste Turm der Schweiz").korrekt,
    ).toBe(false)
    expect(sehenswuerdigkeitById("zytglogge")?.name).toMatch(/Zytglogge/)
  })

  it("marks a matching Bundeshaus answer correct and a non-matching one incorrect", () => {
    expect(
      bewerteAntwort("bundeshaus", "Bundesrat und Parlament tagen dort")
        .korrekt,
    ).toBe(true)
    expect(
      bewerteAntwort("bundeshaus", "Dort wohnt der Stadtbär").korrekt,
    ).toBe(false)
  })
})
