export type TruheStatus = "verschlossen" | "bereit" | "geleert"
export type TruheStand = Record<string, Exclude<TruheStatus, "verschlossen">>

export function truheStatus(stand: TruheStand, id: string): TruheStatus {
  return stand[id] ?? "verschlossen"
}

export function entsperreTruhe(stand: TruheStand, id: string): TruheStand {
  if (stand[id]) return stand
  return { ...stand, [id]: "bereit" }
}

export function oeffneTruhe(
  stand: TruheStand,
  id: string,
): { stand: TruheStand; geoeffnet: boolean } {
  if (stand[id] !== "bereit") {
    return { stand, geoeffnet: false }
  }
  return { stand: { ...stand, [id]: "geleert" }, geoeffnet: true }
}
