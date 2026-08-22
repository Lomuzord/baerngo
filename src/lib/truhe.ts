export type TruheStatus = "verschlossen" | "bereit" | "geleert"

export type TruheEintrag = {
  status: Exclude<TruheStatus, "verschlossen">
  seit: number
}

export type TruheStand = Record<string, TruheEintrag>

export const TRUHE_PAUSE_MS = 3 * 60 * 1000

export function truheStatus(
  stand: TruheStand,
  id: string,
  jetzt = Date.now(),
): TruheStatus {
  const eintrag = stand[id]
  if (!eintrag) return "verschlossen"
  // Zeitstempel aus der Zukunft (Uhr zurückgestellt): Pause verfallen
  // lassen, statt die Truhe weit über die Pause hinaus zu sperren.
  if (eintrag.status === "geleert" && eintrag.seit > jetzt) {
    return "verschlossen"
  }
  if (eintrag.status === "geleert" && jetzt - eintrag.seit >= TRUHE_PAUSE_MS) {
    return "verschlossen"
  }
  return eintrag.status
}

export function truhePauseRestMs(
  stand: TruheStand,
  id: string,
  jetzt = Date.now(),
): number {
  const eintrag = stand[id]
  if (!eintrag || eintrag.status !== "geleert") return 0
  if (eintrag.seit > jetzt) return 0
  return Math.min(
    TRUHE_PAUSE_MS,
    Math.max(0, TRUHE_PAUSE_MS - (jetzt - eintrag.seit)),
  )
}

export function formatiereTruhePause(ms: number): string {
  const sekunden = Math.max(0, Math.ceil(ms / 1000))
  const minuten = Math.floor(sekunden / 60)
  const rest = sekunden % 60
  return `${minuten}:${rest.toString().padStart(2, "0")}`
}

export function entsperreTruhe(
  stand: TruheStand,
  id: string,
  jetzt = Date.now(),
): TruheStand {
  if (truheStatus(stand, id, jetzt) !== "verschlossen") return stand
  return { ...stand, [id]: { status: "bereit", seit: jetzt } }
}

export function oeffneTruhe(
  stand: TruheStand,
  id: string,
  jetzt = Date.now(),
): { stand: TruheStand; geoeffnet: boolean } {
  if (truheStatus(stand, id, jetzt) !== "bereit") {
    return { stand, geoeffnet: false }
  }
  return {
    stand: { ...stand, [id]: { status: "geleert", seit: jetzt } },
    geoeffnet: true,
  }
}

export function parseTruheStand(roh: unknown): TruheStand {
  if (!roh || typeof roh !== "object") return {}
  const stand: TruheStand = {}
  for (const [id, wert] of Object.entries(roh as Record<string, unknown>)) {
    const eintrag = parseEintrag(wert)
    if (eintrag) stand[id] = eintrag
  }
  return stand
}

function parseEintrag(wert: unknown): TruheEintrag | undefined {
  if (wert === "bereit") {
    return { status: "bereit", seit: 0 }
  }
  if (wert === "geleert") {
    return undefined
  }
  if (!wert || typeof wert !== "object") return undefined
  if (!("status" in wert) || !("seit" in wert)) return undefined
  if (wert.status !== "bereit" && wert.status !== "geleert") return undefined
  if (typeof wert.seit !== "number" || !Number.isFinite(wert.seit)) {
    return undefined
  }
  return { status: wert.status, seit: wert.seit }
}
