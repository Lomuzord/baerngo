import { describe, expect, it } from "vitest"
import { listSehenswuerdigkeiten } from "./katalog"
import { ressourceFuerSehenswuerdigkeit } from "./sammeln"

describe("ressourceFuerSehenswuerdigkeit", () => {
  it("gives Gold at the Zytglogge and a book at the GIBB", () => {
    expect(ressourceFuerSehenswuerdigkeit("zytglogge")?.name).toBe("Gold")
    expect(ressourceFuerSehenswuerdigkeit("gibb")?.name).toBe("Buch")
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
