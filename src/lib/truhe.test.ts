import { describe, expect, it } from "vitest"
import {
  TRUHE_PAUSE_MS,
  entsperreTruhe,
  formatiereTruhePause,
  oeffneTruhe,
  parseTruheStand,
  truhePauseRestMs,
  truheStatus,
} from "./truhe"

describe("truhe", () => {
  it("does not lock the chest for hours when the clock jumps backwards", () => {
    const geleert = oeffneTruhe(
      entsperreTruhe({}, "gibb", 1_000_000),
      "gibb",
      1_000_000,
    ).stand
    // Uhr eine Stunde zurückgestellt: Pause verfällt statt 63 Minuten zu warten
    expect(truhePauseRestMs(geleert, "gibb", 1_000_000 - 3_600_000)).toBe(0)
    expect(truheStatus(geleert, "gibb", 1_000_000 - 3_600_000)).toBe(
      "verschlossen",
    )
    // Normale Uhr: Pause gilt wie gehabt
    expect(
      truhePauseRestMs(geleert, "gibb", 1_000_000 + 1_000),
    ).toBe(TRUHE_PAUSE_MS - 1_000)
  })

  it("stays locked until a correct quiz unlocks it, then only a tap empties it", () => {
    const leer = {}
    expect(truheStatus(leer, "gibb")).toBe("verschlossen")

    const bereit = entsperreTruhe(leer, "gibb", 1000)
    expect(truheStatus(bereit, "gibb", 1000)).toBe("bereit")
    expect(entsperreTruhe(bereit, "gibb", 1000)).toEqual(bereit)

    expect(oeffneTruhe(leer, "gibb", 1000).geoeffnet).toBe(false)

    const geoeffnet = oeffneTruhe(bereit, "gibb", 2000)
    expect(geoeffnet.geoeffnet).toBe(true)
    expect(truheStatus(geoeffnet.stand, "gibb", 2000)).toBe("geleert")
    expect(oeffneTruhe(geoeffnet.stand, "gibb", 2000).geoeffnet).toBe(false)
    expect(
      truheStatus(entsperreTruhe(geoeffnet.stand, "gibb", 2000), "gibb", 2000),
    ).toBe("geleert")
  })

  it("locks the quiz again after a few minutes so the chest can repeat", () => {
    const bereit = entsperreTruhe({}, "gibb", 0)
    const { stand } = oeffneTruhe(bereit, "gibb", 10_000)

    expect(truheStatus(stand, "gibb", 10_000)).toBe("geleert")
    expect(truhePauseRestMs(stand, "gibb", 10_000)).toBe(TRUHE_PAUSE_MS)
    expect(truheStatus(stand, "gibb", 10_000 + TRUHE_PAUSE_MS - 1)).toBe(
      "geleert",
    )
    expect(truheStatus(stand, "gibb", 10_000 + TRUHE_PAUSE_MS)).toBe(
      "verschlossen",
    )
    expect(truhePauseRestMs(stand, "gibb", 10_000 + TRUHE_PAUSE_MS)).toBe(0)

    const wieder = entsperreTruhe(stand, "gibb", 10_000 + TRUHE_PAUSE_MS)
    expect(truheStatus(wieder, "gibb", 10_000 + TRUHE_PAUSE_MS)).toBe("bereit")
    expect(oeffneTruhe(wieder, "gibb", 10_000 + TRUHE_PAUSE_MS).geoeffnet).toBe(
      true,
    )
  })

  it("reads old string chests and the timestamp shape from storage", () => {
    const alt = parseTruheStand({ gibb: "geleert", zytglogge: "bereit" })
    expect(alt.gibb).toBeUndefined()
    expect(truheStatus(alt, "gibb", 1)).toBe("verschlossen")
    expect(truheStatus(alt, "zytglogge", 1)).toBe("bereit")

    const neu = parseTruheStand({
      muenster: { status: "geleert", seit: 50_000 },
    })
    expect(truheStatus(neu, "muenster", 50_000)).toBe("geleert")
    expect(parseTruheStand(null)).toEqual({})
    expect(parseTruheStand({ kaputt: { status: "bereit" } })).toEqual({})
  })

  it("formats the remaining pause as m:ss", () => {
    expect(formatiereTruhePause(0)).toBe("0:00")
    expect(formatiereTruhePause(1000)).toBe("0:01")
    expect(formatiereTruhePause(3 * 60 * 1000)).toBe("3:00")
    expect(formatiereTruhePause(125_000)).toBe("2:05")
  })
})
