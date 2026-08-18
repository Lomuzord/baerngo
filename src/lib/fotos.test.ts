import { describe, expect, it } from "vitest"
import { listSehenswuerdigkeiten } from "./katalog"
import { fotoFuerSehenswuerdigkeit } from "./fotos"

describe("fotoFuerSehenswuerdigkeit", () => {
  it("gives every catalogued sight its own photo", () => {
    for (const eintrag of listSehenswuerdigkeiten()) {
      const foto = fotoFuerSehenswuerdigkeit(eintrag.id)
      expect(foto?.src).toMatch(new RegExp(`/orte/${eintrag.id}\\.`))
    }
  })
})
