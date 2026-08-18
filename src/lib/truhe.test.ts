import { describe, expect, it } from "vitest"
import { entsperreTruhe, oeffneTruhe, truheStatus } from "./truhe"

describe("truhe", () => {
  it("stays locked until a correct quiz unlocks it, then only a tap empties it", () => {
    const leer = {}
    expect(truheStatus(leer, "gibb")).toBe("verschlossen")

    const bereit = entsperreTruhe(leer, "gibb")
    expect(truheStatus(bereit, "gibb")).toBe("bereit")
    expect(entsperreTruhe(bereit, "gibb")).toEqual(bereit)

    expect(oeffneTruhe(leer, "gibb").geoeffnet).toBe(false)

    const geoeffnet = oeffneTruhe(bereit, "gibb")
    expect(geoeffnet.geoeffnet).toBe(true)
    expect(truheStatus(geoeffnet.stand, "gibb")).toBe("geleert")
    expect(oeffneTruhe(geoeffnet.stand, "gibb").geoeffnet).toBe(false)
    expect(truheStatus(entsperreTruhe(geoeffnet.stand, "gibb"), "gibb")).toBe(
      "geleert",
    )
  })
})
