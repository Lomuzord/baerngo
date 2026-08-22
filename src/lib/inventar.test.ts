import { describe, expect, it } from "vitest"
import {
  HOTBAR_LAENGE,
  INVENTAR_LAENGE,
  hotbarVon,
  klickSlot,
  legeBeuteInSlots,
  legeBeuteInSlotsMitRest,
  legeCursorZurueck,
  legeCursorZurueckMitRest,
  leereSlots,
  nimmAnzahl,
  nimmVonIndex,
  parseSlots,
  slotsAusBeutel,
  stapelMaximum,
  verschiebeSlot,
  zaehleSlots,
} from "./inventar"

describe("slotsAusBeutel", () => {
  it("puts stacks into hotbar order and keeps the player's arrangement", () => {
    const slots = slotsAusBeutel({ gold: 3, pickel: 1, stein: 8 })
    expect(slots).toHaveLength(INVENTAR_LAENGE)
    expect(hotbarVon(slots)[0]).toEqual({ id: "gold", anzahl: 3 })
    expect(hotbarVon(slots)[1]).toEqual({ id: "pickel", anzahl: 1 })
    expect(hotbarVon(slots)[2]).toEqual({ id: "stein", anzahl: 8 })
    expect(zaehleSlots(slots)).toEqual({ gold: 3, pickel: 1, stein: 8 })
    expect(stapelMaximum("pickel")).toBe(1)
    expect(stapelMaximum("stein")).toBe(64)
  })

  it("does not auto-sort tools to the front", () => {
    const slots = slotsAusBeutel({ stein: 2, pickel: 1 })
    expect(slots[0]?.id).toBe("stein")
    expect(slots[1]?.id).toBe("pickel")
  })
})

describe("legeBeuteInSlots", () => {
  it("fills an existing stack then the next empty hotbar slot", () => {
    const start = slotsAusBeutel({ gold: 2 })
    const danach = legeBeuteInSlots(start, [
      { gegenstandId: "gold", anzahl: 1 },
      { gegenstandId: "holz", anzahl: 4 },
    ])
    expect(danach[0]).toEqual({ id: "gold", anzahl: 3 })
    expect(danach[1]).toEqual({ id: "holz", anzahl: 4 })
  })
})

describe("klickSlot", () => {
  it("picks up a stack and places it on an empty slot", () => {
    const start = slotsAusBeutel({ gold: 5, stein: 2 })
    const genommen = klickSlot(start, 0, null, "links")
    expect(genommen.cursor).toEqual({ id: "gold", anzahl: 5 })
    expect(genommen.slots[0]).toBeNull()
    const gelegt = klickSlot(genommen.slots, 4, genommen.cursor, "links")
    expect(gelegt.cursor).toBeNull()
    expect(gelegt.slots[4]).toEqual({ id: "gold", anzahl: 5 })
    expect(gelegt.slots[1]).toEqual({ id: "stein", anzahl: 2 })
  })

  it("merges the same item and swaps different items", () => {
    const slots = leereSlots()
    slots[0] = { id: "stein", anzahl: 10 }
    slots[1] = { id: "stein", anzahl: 3 }
    slots[2] = { id: "gold", anzahl: 1 }
    const merge = klickSlot(slots, 0, { id: "stein", anzahl: 4 }, "links")
    expect(merge.slots[0]).toEqual({ id: "stein", anzahl: 14 })
    expect(merge.cursor).toBeNull()
    const tausch = klickSlot(slots, 2, { id: "holz", anzahl: 2 }, "links")
    expect(tausch.slots[2]).toEqual({ id: "holz", anzahl: 2 })
    expect(tausch.cursor).toEqual({ id: "gold", anzahl: 1 })
  })

  it("takes one on a long press and places one", () => {
    const start = slotsAusBeutel({ stein: 5 })
    const eins = klickSlot(start, 0, null, "rechts")
    expect(eins.cursor).toEqual({ id: "stein", anzahl: 1 })
    expect(eins.slots[0]).toEqual({ id: "stein", anzahl: 4 })
    const gelegt = klickSlot(eins.slots, 1, { id: "stein", anzahl: 3 }, "rechts")
    expect(gelegt.slots[1]).toEqual({ id: "stein", anzahl: 1 })
    expect(gelegt.cursor).toEqual({ id: "stein", anzahl: 2 })
  })
})

describe("legeCursorZurueck", () => {
  it("puts a held stack back into its original slot", () => {
    const start = slotsAusBeutel({ gold: 4, stein: 1 })
    const genommen = klickSlot(start, 0, null, "links")
    expect(genommen.cursor).toEqual({ id: "gold", anzahl: 4 })
    const danach = legeCursorZurueck(genommen.slots, genommen.cursor, 0)
    expect(danach[0]).toEqual({ id: "gold", anzahl: 4 })
    expect(danach[1]).toEqual({ id: "stein", anzahl: 1 })
  })
})

describe("legeBeuteInSlotsMitRest", () => {
  it("reports what does not fit instead of dropping it", () => {
    const voll = Array.from({ length: 36 }, (_, i) =>
      i === 0 ? { id: "gold", anzahl: 64 } : { id: "stein", anzahl: 64 },
    )
    const gelegt = legeBeuteInSlotsMitRest(voll, [
      { gegenstandId: "gold", anzahl: 10 },
    ])
    expect(gelegt.rest).toEqual([{ gegenstandId: "gold", anzahl: 10 }])
    expect(gelegt.slots[0]).toEqual({ id: "gold", anzahl: 64 })

    const passt = legeBeuteInSlotsMitRest(slotsAusBeutel({ gold: 60 }), [
      { gegenstandId: "gold", anzahl: 10 },
    ])
    expect(passt.rest).toEqual([])
    expect(zaehleSlots(passt.slots).gold).toBe(70)
  })

  it("keeps the remainder on the cursor when the bag is full", () => {
    const voll = Array.from({ length: 36 }, () => ({ id: "stein", anzahl: 64 }))
    const zurueck = legeCursorZurueckMitRest(voll, { id: "gold", anzahl: 7 })
    expect(zurueck.cursor).toEqual({ id: "gold", anzahl: 7 })
    expect(zaehleSlots(zurueck.slots).gold).toBeUndefined()
  })
})

describe("verschiebeSlot", () => {
  it("drags a stack to another slot without shuffling the rest", () => {
    const start = slotsAusBeutel({ gold: 1, holz: 2, stein: 3 })
    const danach = verschiebeSlot(start, 0, 5)
    expect(danach[0]).toBeNull()
    expect(danach[5]).toEqual({ id: "gold", anzahl: 1 })
    expect(danach[1]).toEqual({ id: "holz", anzahl: 2 })
    expect(danach[2]).toEqual({ id: "stein", anzahl: 3 })
  })
})

describe("nimmVonIndex / nimmAnzahl", () => {
  it("removes from the chosen hotbar slot first", () => {
    const start = slotsAusBeutel({ stein: 4, holz: 2 })
    const vonSlot = nimmVonIndex(start, 0, 1)
    expect(vonSlot.ok).toBe(true)
    expect(vonSlot.slots[0]).toEqual({ id: "stein", anzahl: 3 })
    const ohne = nimmAnzahl(vonSlot.slots, "holz", 2)
    expect(ohne?.[1]).toBeNull()
    expect(nimmAnzahl(start, "gold", 1)).toBeNull()
  })
})

describe("parseSlots", () => {
  it("migrates the old bag and keeps a saved layout", () => {
    const ausBeutel = parseSlots({ gold: 3, pickel: 1, unbekannt: 9 })
    expect(ausBeutel[0]).toEqual({ id: "gold", anzahl: 3 })
    expect(ausBeutel[1]).toEqual({ id: "pickel", anzahl: 1 })
    expect(hotbarVon(ausBeutel)).toHaveLength(HOTBAR_LAENGE)
    const layout = leereSlots()
    layout[8] = { id: "smaragd", anzahl: 2 }
    expect(parseSlots(layout)[8]).toEqual({ id: "smaragd", anzahl: 2 })
    expect(parseSlots({ slots: layout })[8]?.id).toBe("smaragd")
  })
})
