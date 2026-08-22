import { describe, expect, it } from "vitest"
import { sehenswuerdigkeitById } from "./katalog"
import { distanzMeter, lageVersetzt } from "./reichweite"
import {
  WILD_ANZAHL,
  WILD_DESPAWN_METER,
  WILD_LAUF_METER,
  WILD_RADIUS_MAX,
  WILD_RADIUS_MIN,
  WILD_SAMMEL_METER,
  aktualisiereWild,
  entferneWildBlock,
  erzeugeWildbloecke,
  parseWildStand,
  sammelRadius,
} from "./wildspawn"

describe("sammelRadius", () => {
  it("keeps a small GPS slack without swallowing the whole spawn ring", () => {
    expect(sammelRadius()).toBe(WILD_SAMMEL_METER)
    expect(sammelRadius(0)).toBe(WILD_SAMMEL_METER)
    expect(sammelRadius(18)).toBeLessThan(WILD_SAMMEL_METER + 12)
    expect(sammelRadius(80)).toBe(WILD_SAMMEL_METER + 10)
    expect(WILD_RADIUS_MIN).toBeGreaterThan(WILD_SAMMEL_METER)
  })
})

describe("erzeugeWildbloecke", () => {
  it("rings the player with environment blocks at walking distance", () => {
    const zytglogge = sehenswuerdigkeitById("zytglogge")!.lage
    const spieler = { lat: zytglogge.lat + 0.004, lng: zytglogge.lng }
    const bloecke = erzeugeWildbloecke(spieler, () => "park", 1_000)
    expect(bloecke.length).toBe(WILD_ANZAHL)
    for (const block of bloecke) {
      const distanz = distanzMeter(spieler, block.lage)
      expect(distanz).toBeGreaterThanOrEqual(WILD_RADIUS_MIN - 2)
      expect(distanz).toBeLessThanOrEqual(WILD_RADIUS_MAX + 2)
      expect(block.umwelt).toBe("park")
      // Parks liefern Park-Blöcke — oder neuerdings mal ein Huhn
      expect(block.gegenstandId).toMatch(/gras|stamm|laub|moosstein|huhn/)
    }
    expect(entferneWildBlock(bloecke, bloecke[0]!.id)).toHaveLength(
      WILD_ANZAHL - 1,
    )
    expect(
      parseWildStand({ schluessel: "1:2:3", bloecke })?.bloecke,
    ).toHaveLength(WILD_ANZAHL)
    expect(parseWildStand({ gibb: "geleert" })).toBeNull()
  })

  it("never keeps a river tile and still fills the ring on land", () => {
    const spieler = { lat: 46.948, lng: 7.447 }
    const nurWasser = erzeugeWildbloecke(spieler, () => "wasser", 20_000)
    expect(nurWasser).toHaveLength(WILD_ANZAHL)
    expect(nurWasser.every((block) => block.umwelt !== "wasser")).toBe(true)

    let i = 0
    const mix = erzeugeWildbloecke(
      spieler,
      () => (i++ % 2 === 0 ? "wasser" : "park"),
      21_000,
    )
    expect(mix).toHaveLength(WILD_ANZAHL)
    expect(mix.every((block) => block.umwelt !== "wasser")).toBe(true)
  })

  it("does not refill after a collect until the player walks", () => {
    const spieler = { lat: 46.948, lng: 7.447 }
    const erste = erzeugeWildbloecke(spieler, () => "park", 10_000)
    const still = aktualisiereWild(
      erste,
      spieler,
      () => "park",
      10_400,
      undefined,
      spieler,
    )
    expect(still.bloecke.map((block) => block.id)).toEqual(
      erste.map((block) => block.id),
    )

    const ohne = entferneWildBlock(erste, erste[0]!.id)
    const nachNimm = aktualisiereWild(
      ohne,
      spieler,
      () => "park",
      10_800,
      undefined,
      spieler,
    )
    expect(nachNimm.bloecke).toHaveLength(WILD_ANZAHL - 1)

    const leer = aktualisiereWild([], spieler, () => "park", 12_000)
    expect(leer.bloecke).toHaveLength(WILD_ANZAHL)

    const bern = { lat: 46.9512, lng: 7.4512 }
    const alt = erzeugeWildbloecke(bern, () => "park", 1_000)
    const hier = lageVersetzt(bern, 400, 0)
    const umgezogen = aktualisiereWild(alt, hier, () => "park", 13_000, 0, bern)
    expect(umgezogen.bloecke).toHaveLength(WILD_ANZAHL)
    for (const block of umgezogen.bloecke) {
      expect(distanzMeter(hier, block.lage)).toBeLessThanOrEqual(
        WILD_RADIUS_MAX + 5,
      )
    }

    const weiter = lageVersetzt(spieler, WILD_LAUF_METER + 15, 0)
    const danach = aktualisiereWild(ohne, weiter, () => "park", 11_000, 0, spieler)
    expect(danach.bloecke).toHaveLength(WILD_ANZAHL)
    const neue = danach.bloecke.filter(
      (block) => !erste.some((alt) => alt.id === block.id),
    )
    expect(neue.length).toBeGreaterThan(0)
    expect(
      danach.bloecke.every(
        (block) => distanzMeter(weiter, block.lage) <= WILD_DESPAWN_METER + 2,
      ),
    ).toBe(true)
  })

  it("does not refill in place after collecting everything, until walking or the pause", () => {
    const spieler = { lat: 46.948, lng: 7.447 }
    const leerGesammelt = aktualisiereWild(
      [],
      spieler,
      () => "park",
      50_000,
      undefined,
      spieler,
      49_000,
    )
    expect(leerGesammelt.bloecke).toHaveLength(0)
    expect(leerGesammelt.letzteSpawnZeit).toBe(49_000)

    const gelaufen = lageVersetzt(spieler, WILD_LAUF_METER + 5, 0)
    const nachLauf = aktualisiereWild(
      [],
      gelaufen,
      () => "park",
      51_000,
      undefined,
      spieler,
      49_000,
    )
    expect(nachLauf.bloecke).toHaveLength(WILD_ANZAHL)
    expect(nachLauf.letzteSpawnZeit).toBe(51_000)

    const nachPause = aktualisiereWild(
      [],
      spieler,
      () => "park",
      49_000 + 9 * 60 * 1000,
      undefined,
      spieler,
      49_000,
    )
    expect(nachPause.bloecke).toHaveLength(WILD_ANZAHL)
  })

  it("is not only dirt, and does not hand out crafted planks", () => {
    const spieler = { lat: 46.948, lng: 7.447 }
    const unbekannt = erzeugeWildbloecke(spieler, () => "unbekannt", 22_000)
    const mix = new Set(unbekannt.map((block) => block.gegenstandId))
    expect(mix.size).toBeGreaterThan(2)
    expect(mix.has("erde") && mix.size === 1).toBe(false)
    expect(mix.has("holz")).toBe(false)
    expect(mix.has("glas")).toBe(false)
  })
})
