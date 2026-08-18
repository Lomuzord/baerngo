import { describe, expect, it } from "vitest"
import { bewerteAntwort } from "./bewertung"
import { sehenswuerdigkeitById } from "./katalog"

describe("bewerteAntwort", () => {
  it("marks the matching Zytglogge answer correct and a non-matching one incorrect", () => {
    const zytglogge = sehenswuerdigkeitById("zytglogge")
    expect(zytglogge).toBeDefined()
    const richtig = zytglogge!.quiz.richtigeAntwort
    const falsch =
      zytglogge!.quiz.optionen.find((option) => option !== richtig) ??
      "keine Uhr"

    expect(bewerteAntwort("zytglogge", richtig).korrekt).toBe(true)
    expect(bewerteAntwort("zytglogge", falsch).korrekt).toBe(false)
  })

  it("marks the matching Bundeshaus answer correct and a non-matching one incorrect", () => {
    const bundeshaus = sehenswuerdigkeitById("bundeshaus")
    expect(bundeshaus).toBeDefined()
    const richtig = bundeshaus!.quiz.richtigeAntwort
    const falsch =
      bundeshaus!.quiz.optionen.find((option) => option !== richtig) ??
      "Stadtbär"

    expect(bewerteAntwort("bundeshaus", richtig).korrekt).toBe(true)
    expect(bewerteAntwort("bundeshaus", falsch).korrekt).toBe(false)
  })
})
