"use client"

// Zählt echte Gehstrecke für die Wander-Truhe und sammelt Brunnen
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
import {
  distanzZuwachs,
  oeffneWanderTruhe,
  parseWanderung,
  WANDER_ZIEL_METER,
} from "@/lib/wanderung"
import type { SpielerOrt } from "./useSpielerOrt"

const WANDER_SPEICHER = "baerngo-wanderung"
const BRUNNEN_SPEICHER = "baerngo-brunnen"

export function useWanderweg(
  spieler: SpielerOrt,
  aufEreignis: (hinweis: string, beute: Beute[]) => void,
) {
  const [meter, setMeter] = useState(0)
  const [brunnen, setBrunnen] = useState<BrunnenStand>({
    gesammelt: [],
    belohnt: false,
  })
  const letzteLage = useRef<Lage | null>(null)
  const aufEreignisRef = useRef(aufEreignis)
  aufEreignisRef.current = aufEreignis

  useEffect(() => {
    setMeter(parseWanderung(leseRoh(WANDER_SPEICHER)))
    setBrunnen(parseBrunnenStand(leseRoh(BRUNNEN_SPEICHER)))
  }, [])

  const lage = spieler.status === "bereit" ? spieler.lage : null
  const genauigkeit = spieler.status === "bereit" ? spieler.genauigkeit : undefined
  useEffect(() => {
    if (!lage) return
    const zuwachs = distanzZuwachs(letzteLage.current, lage, genauigkeit)
    letzteLage.current = lage
    if (zuwachs > 0) {
      setMeter((bisher) => {
        const danach = Math.min(WANDER_ZIEL_METER, bisher + zuwachs)
        schreibe(WANDER_SPEICHER, danach)
        return danach
      })
    }
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

  function oeffneTruhe(): Beute[] | null {
    if (meter < WANDER_ZIEL_METER) return null
    const beute = oeffneWanderTruhe()
    setMeter(0)
    schreibe(WANDER_SPEICHER, 0)
    return beute
  }

  return { meter, brunnen, oeffneTruhe }
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
