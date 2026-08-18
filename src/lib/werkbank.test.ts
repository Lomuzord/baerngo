import { describe, expect, it } from "vitest"
import { craft } from "./werkbank"

describe("craft", () => {
  it("turns two gold into a gold block through the werkbank owner", () => {
    const ergebnis = craft({ gold: 2, honig: 1 }, "goldblock")
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return
    expect(ergebnis.ergebnis.id).toBe("goldblock")
    expect(ergebnis.inventar.goldblock).toBe(1)
    expect(ergebnis.inventar.gold).toBeUndefined()
    expect(ergebnis.inventar.honig).toBe(1)
  })

  it("refuses a recipe when a material is missing", () => {
    const ergebnis = craft({ gold: 1 }, "goldblock")
    expect(ergebnis).toEqual({ ok: false, grund: "Zu wenig Material" })
  })
})
