import { describe, expect, it } from "vitest"
import { bewerteAntwort } from "./bewertung"
import { sehenswuerdigkeitById } from "./katalog"

describe("bewerteAntwort", () => {
  it("marks a matching Zytglogge answer correct and a non-matching one incorrect", () => {
    expect(bewerteAntwort("zytglogge", 0, "Kaspar Brunner").korrekt).toBe(true)
    expect(bewerteAntwort("zytglogge", 0, "Niklaus Manuel").korrekt).toBe(false)
    expect(sehenswuerdigkeitById("zytglogge")?.name).toMatch(/Zytglogge/)
  })

  it("scores each question of a sight against its own answer", () => {
    // Frage 1 des Zytglogge: das alte Stadttor
    expect(
      bewerteAntwort("zytglogge", 1, "Das westliche Stadttor Berns").korrekt,
    ).toBe(true)
    // Die Antwort der einen Frage gilt nicht für die andere
    expect(bewerteAntwort("zytglogge", 1, "Kaspar Brunner").korrekt).toBe(false)
    // Unbekannte Frage-Ids sind immer falsch
    expect(bewerteAntwort("zytglogge", 99, "Kaspar Brunner").korrekt).toBe(false)
    expect(bewerteAntwort("zytglogge", -1, "Kaspar Brunner").korrekt).toBe(false)
    expect(bewerteAntwort("zytglogge", 0.5, "Kaspar Brunner").korrekt).toBe(false)
  })

  it("marks a matching GIBB answer correct and a non-matching one incorrect", () => {
    expect(
      bewerteAntwort(
        "gibb",
        0,
        "Die gewerblich-industrielle Berufsfachschule Bern",
      ).korrekt,
    ).toBe(true)
    expect(
      bewerteAntwort("gibb", 0, "Das Bundeshaus der Bundesversammlung").korrekt,
    ).toBe(false)
  })
})
