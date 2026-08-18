import { describe, expect, it } from "vitest"
import { HOTBAR_LAENGE, hotbarSlots } from "./hotbar"

describe("hotbarSlots", () => {
  it("fills nine Minecraft-style slots from the real item catalog", () => {
    const slots = hotbarSlots({ gold: 3, pickel: 1, stein: 8 })
    expect(slots).toHaveLength(HOTBAR_LAENGE)
    expect(slots.find((slot) => slot.id === "gold")?.anzahl).toBe(3)
    expect(slots.find((slot) => slot.id === "pickel")?.anzahl).toBe(1)
    expect(slots.filter((slot) => slot.id === null).length).toBeGreaterThan(0)
    expect(hotbarSlots({}).every((slot) => slot.id === null)).toBe(true)
  })
})
