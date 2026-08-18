"use server"

import { bewerteAntwort } from "@/lib/bewertung"
import { istInReichweite } from "@/lib/reichweite"

export type SpielErgebnis =
  | { art: "zu-weit"; distanzMeter: number }
  | { art: "bewertet"; korrekt: boolean }

export async function submitAntwort(
  sehenswuerdigkeitId: string,
  antwort: string,
  lat: number,
  lng: number,
): Promise<SpielErgebnis> {
  const reichweite = istInReichweite({ lat, lng }, sehenswuerdigkeitId)
  if (!reichweite.erlaubt) {
    return { art: "zu-weit", distanzMeter: reichweite.distanzMeter }
  }
  const bewertung = bewerteAntwort(sehenswuerdigkeitId, antwort)
  return { art: "bewertet", korrekt: bewertung.korrekt }
}
