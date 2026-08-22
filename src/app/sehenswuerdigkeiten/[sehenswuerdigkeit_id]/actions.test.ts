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
      0,
      "Kaspar Brunner",
      lat,
      lng,
    )
    const falsch = await submitAntwort(
      "zytglogge",
      0,
      "Niklaus Manuel",
      lat,
      lng,
    )

    expect(richtig).toEqual({ art: "bewertet", korrekt: true })
    expect(falsch).toEqual({ art: "bewertet", korrekt: false })
  })

  it("scores the second Zytglogge question independently", async () => {
    const { lat, lng } = sehenswuerdigkeitById("zytglogge")!.lage
    const richtig = await submitAntwort(
      "zytglogge",
      1,
      "Das westliche Stadttor Berns",
      lat,
      lng,
    )
    expect(richtig).toEqual({ art: "bewertet", korrekt: true })
  })

  it("scores a matching and a non-matching GIBB answer through the play entry point", async () => {
    const gibb = sehenswuerdigkeitById("gibb")
    expect(gibb).toBeDefined()
    const { lat, lng } = gibb!.lage

    const richtig = await submitAntwort(
      "gibb",
      0,
      "Die gewerblich-industrielle Berufsfachschule Bern",
      lat,
      lng,
    )
    const falsch = await submitAntwort(
      "gibb",
      0,
      "Das Bundeshaus der Bundesversammlung",
      lat,
      lng,
    )

    expect(richtig).toEqual({ art: "bewertet", korrekt: true })
    expect(falsch).toEqual({ art: "bewertet", korrekt: false })
  })
})
