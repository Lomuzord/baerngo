"use server"

import { bewerteAntwort } from "@/lib/bewertung"
import { istInReichweite } from "@/lib/reichweite"

export type SpielErgebnis =
  | { art: "zu-weit"; distanzMeter: number }
  | { art: "bewertet"; korrekt: boolean }

export async function submitAntwort(
  sehenswuerdigkeitId: string,
  frageId: number,
  antwort: string,
  lat: number,
  lng: number,
): Promise<SpielErgebnis> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { art: "zu-weit", distanzMeter: Number.POSITIVE_INFINITY }
  }
  const reichweite = istInReichweite({ lat, lng }, sehenswuerdigkeitId)
  if (!reichweite.erlaubt) {
    return { art: "zu-weit", distanzMeter: reichweite.distanzMeter }
  }
  const bewertung = bewerteAntwort(sehenswuerdigkeitId, frageId, antwort)
  return { art: "bewertet", korrekt: bewertung.korrekt }
}
