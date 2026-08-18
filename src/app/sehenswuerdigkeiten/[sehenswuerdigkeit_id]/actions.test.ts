import { describe, expect, it } from "vitest"
import { sehenswuerdigkeitById } from "@/lib/katalog"
import { submitAntwort } from "./actions"

describe("submitAntwort", () => {
  it("scores a matching and a non-matching Zytglogge answer through the play entry point", async () => {
    const zytglogge = sehenswuerdigkeitById("zytglogge")
    expect(zytglogge).toBeDefined()
    const { lat, lng } = zytglogge!.lage

    const richtig = await submitAntwort(
      "zytglogge",
      "Astronomische Uhr und Glockenspiel",
      lat,
      lng,
    )
    const falsch = await submitAntwort(
      "zytglogge",
      "Der höchste Turm der Schweiz",
      lat,
      lng,
    )

    expect(richtig).toEqual({ art: "bewertet", korrekt: true })
    expect(falsch).toEqual({ art: "bewertet", korrekt: false })
  })

  it("scores a matching and a non-matching Bundeshaus answer through the play entry point", async () => {
    const bundeshaus = sehenswuerdigkeitById("bundeshaus")
    expect(bundeshaus).toBeDefined()
    const { lat, lng } = bundeshaus!.lage

    const richtig = await submitAntwort(
      "bundeshaus",
      "Bundesrat und Parlament tagen dort",
      lat,
      lng,
    )
    const falsch = await submitAntwort(
      "bundeshaus",
      "Dort wohnt der Stadtbär",
      lat,
      lng,
    )

    expect(richtig).toEqual({ art: "bewertet", korrekt: true })
    expect(falsch).toEqual({ art: "bewertet", korrekt: false })
  })
})
