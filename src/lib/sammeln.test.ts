import { describe, expect, it } from "vitest"
import { listGegenstaende } from "./gegenstaende"
import { listSehenswuerdigkeiten } from "./katalog"
import { ressourceFuerSehenswuerdigkeit } from "./sammeln"

describe("ressourceFuerSehenswuerdigkeit", () => {
  it("gives Gold at the Zytglogge and a book at the GIBB", () => {
    expect(ressourceFuerSehenswuerdigkeit("zytglogge")?.id).toBe("gold")
    expect(ressourceFuerSehenswuerdigkeit("gibb")?.id).toBe("buch")
  })

  it("gives every catalogued sight its own resource", () => {
    const ids = new Set<string>()
    for (const eintrag of listSehenswuerdigkeiten()) {
      const ressource = ressourceFuerSehenswuerdigkeit(eintrag.id)
      expect(ressource).toBeDefined()
      expect(ids.has(ressource!.id)).toBe(false)
      ids.add(ressource!.id)
    }
  })
})

describe("placeable catalog", () => {
  it("lists more placeable materials than the five sight drops", () => {
    const sichtLoot = listSehenswuerdigkeiten().map(
      (eintrag) => ressourceFuerSehenswuerdigkeit(eintrag.id)!.id,
    )
    const alle = listGegenstaende().map((item) => item.id)
    expect(sichtLoot).toHaveLength(5)
    expect(alle.length).toBeGreaterThan(sichtLoot.length)
    for (const id of sichtLoot) {
      expect(alle).toContain(id)
    }
    expect(alle).toContain("holz")
    expect(alle).toContain("stein")
    expect(alle).toContain("pickel")
  })
})
