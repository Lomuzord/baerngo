import { describe, expect, it, vi } from "vitest"
import { HAPTIK_ARTEN, istHaptikArt, spieleHaptik } from "./haptik"

describe("spieleHaptik", () => {
  it("plays a named pattern through the vibration API", () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal("navigator", { vibrate })
    expect(spieleHaptik("truhe")).toBe(true)
    expect(vibrate).toHaveBeenCalledWith([20, 35, 28, 35, 55])
    expect(spieleHaptik("tipp")).toBe(true)
    expect(vibrate).toHaveBeenCalledWith(10)
    expect(spieleHaptik("sammeln")).toBe(true)
    for (const art of HAPTIK_ARTEN) {
      expect(istHaptikArt(art)).toBe(true)
    }
    expect(istHaptikArt("aus")).toBe(false)
    vi.unstubAllGlobals()
  })

  it("no-ops when the browser cannot vibrate", () => {
    vi.stubGlobal("navigator", {})
    expect(spieleHaptik("tipp")).toBe(false)
    vi.unstubAllGlobals()
  })
})
