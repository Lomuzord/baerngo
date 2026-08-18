import { describe, expect, it } from "vitest"
import { listSehenswuerdigkeiten } from "./katalog"

describe("listSehenswuerdigkeiten", () => {
  it("includes Zytglogge/Zytglogä and at least two other Bern sights, each with a quiz", () => {
    const katalog = listSehenswuerdigkeiten()
    const zytglogge = katalog.find(
      (eintrag) =>
        eintrag.name.includes("Zytglogge") ||
        eintrag.alias.some((name) => name.includes("Zytglogä")),
    )
    expect(zytglogge?.quiz.frage.length).toBeGreaterThan(0)
    expect(zytglogge?.quiz.optionen.length).toBeGreaterThan(1)

    expect(katalog.some((eintrag) => eintrag.id === "gibb")).toBe(true)

    const weitere = katalog.filter((eintrag) => eintrag.id !== zytglogge?.id)
    expect(weitere.length).toBeGreaterThanOrEqual(2)
    for (const eintrag of weitere) {
      expect(eintrag.quiz.frage.length).toBeGreaterThan(0)
      expect(eintrag.quiz.optionen.length).toBeGreaterThan(1)
    }
  })
})
