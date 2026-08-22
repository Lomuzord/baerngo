import { describe, expect, it } from "vitest"
import { HOTBAR_LAENGE, hotbarSlots } from "./hotbar"
import { slotsAusBeutel } from "./inventar"

describe("hotbarSlots", () => {
  it("reads the first nine inventory slots as the hotbar", () => {
    const slots = slotsAusBeutel({ gold: 3, pickel: 1, stein: 8 })
    const hotbar = hotbarSlots(slots)
    expect(hotbar).toHaveLength(HOTBAR_LAENGE)
    expect(hotbar[0]).toEqual({ id: "gold", anzahl: 3 })
    expect(hotbar[1]).toEqual({ id: "pickel", anzahl: 1 })
    expect(hotbar.filter((slot) => slot === null).length).toBeGreaterThan(0)
    expect(hotbarSlots([]).every((slot) => slot === null)).toBe(true)
  })
})
