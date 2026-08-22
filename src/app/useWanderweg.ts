"use client"

// Meldet echte Gehstrecke an die Tagesaufgaben und sammelt Brunnen
// im Vorbeigehen — beides direkt aus den GPS-Fixen des Spielers.

import { useEffect, useRef, useState } from "react"
import {
  BRUNNEN_BELOHNUNG,
  brunnenById,
  neuGesammelt,
  parseBrunnenStand,
  sammlungKomplett,
  type BrunnenStand,
} from "@/lib/brunnen"
import type { Lage } from "@/lib/orte"
import type { Beute } from "@/lib/sammeln"
import { distanzZuwachs } from "@/lib/wanderung"
import type { SpielerOrt } from "./useSpielerOrt"
import { meldeTagesEreignis } from "./tagesEreignis"

const BRUNNEN_SPEICHER = "baerngo-brunnen"

export function useWanderweg(
  spieler: SpielerOrt,
  aufEreignis: (hinweis: string, beute: Beute[]) => void,
) {
  const [brunnen, setBrunnen] = useState<BrunnenStand>({
    gesammelt: [],
    belohnt: false,
  })
  const letzteLage = useRef<Lage | null>(null)
  const aufEreignisRef = useRef(aufEreignis)
  aufEreignisRef.current = aufEreignis

  useEffect(() => {
    setBrunnen(parseBrunnenStand(leseRoh(BRUNNEN_SPEICHER)))
  }, [])

  const lage = spieler.status === "bereit" ? spieler.lage : null
  const genauigkeit = spieler.status === "bereit" ? spieler.genauigkeit : undefined
  useEffect(() => {
    if (!lage) return
    const zuwachs = distanzZuwachs(letzteLage.current, lage, genauigkeit)
    letzteLage.current = lage
    if (zuwachs > 0) meldeTagesEreignis("meter", zuwachs)
    // Brunnen im Vorbeigehen einsammeln
    setBrunnen((bisher) => {
      const neu = neuGesammelt(bisher.gesammelt, lage)
      if (neu.length === 0) return bisher
      const danach: BrunnenStand = {
        gesammelt: [...bisher.gesammelt, ...neu],
        belohnt: bisher.belohnt,
      }
      const namen = neu
        .map((id) => brunnenById(id)?.name ?? id)
        .join(" · ")
      if (sammlungKomplett(danach.gesammelt) && !danach.belohnt) {
        danach.belohnt = true
        aufEreignisRef.current(
          `${namen} — Sammlung komplett! Belohnungstruhe!`,
          [...BRUNNEN_BELOHNUNG],
        )
      } else {
        aufEreignisRef.current(`Brunnen-Abzeichen: ${namen}`, [])
      }
      schreibe(BRUNNEN_SPEICHER, danach)
      return danach
    })
  }, [lage, genauigkeit])

  return { brunnen }
}

function leseRoh(schluessel: string): unknown {
  if (typeof window === "undefined") return null
  try {
    const roh = window.localStorage.getItem(schluessel)
    return roh ? (JSON.parse(roh) as unknown) : null
  } catch {
    return null
  }
}

function schreibe(schluessel: string, wert: unknown) {
  window.localStorage.setItem(schluessel, JSON.stringify(wert))
}
