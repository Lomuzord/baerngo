import { describe, expect, it } from "vitest"
import { listSehenswuerdigkeiten, quizOhneLoesung } from "./katalog"

describe("listSehenswuerdigkeiten", () => {
  it("includes Zytglogge/Zytglogä and at least two other Bern sights, each with quizzes", () => {
    const katalog = listSehenswuerdigkeiten()
    const zytglogge = katalog.find(
      (eintrag) =>
        eintrag.name.includes("Zytglogge") ||
        eintrag.alias.some((name) => name.includes("Zytglogä")),
    )
    expect(zytglogge?.quizze.length).toBeGreaterThanOrEqual(2)

    const gibb = katalog.find((eintrag) => eintrag.id === "gibb")
    expect(gibb?.name).toBe("GIBB Bern")
    expect(gibb?.quizze[0]?.frage).toMatch(/GIBB Bern/)

    const weitere = katalog.filter((eintrag) => eintrag.id !== zytglogge?.id)
    expect(weitere.length).toBeGreaterThanOrEqual(2)
    for (const eintrag of katalog) {
      for (const quiz of eintrag.quizze) {
        expect(quiz.frage.length).toBeGreaterThan(0)
        expect(quiz.optionen.length).toBeGreaterThanOrEqual(4)
        expect(quiz.optionen).toContain(quiz.richtigeAntwort)
      }
    }
  })

  it("hands the client a random question without the answer", () => {
    const quiz = quizOhneLoesung("zytglogge")
    expect(quiz).toBeDefined()
    expect(quiz!.frageId).toBeGreaterThanOrEqual(0)
    expect(quiz!.frage.length).toBeGreaterThan(0)
    expect(
      (quiz as unknown as { richtigeAntwort?: string }).richtigeAntwort,
    ).toBeUndefined()
    // Über viele Züge kommen beide Zytglogge-Fragen vor
    const gesehen = new Set<number>()
    for (let i = 0; i < 60; i++) {
      gesehen.add(quizOhneLoesung("zytglogge")!.frageId)
    }
    expect(gesehen.size).toBeGreaterThanOrEqual(2)
  })
})
