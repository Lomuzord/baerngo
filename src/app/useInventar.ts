"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  legeBeuteInSlots,
  legeBeuteInSlotsMitRest,
  leereSlots,
  parseSlots,
  zaehleSlots,
  type InventarSlot,
} from "@/lib/inventar"
import type { Beute } from "@/lib/sammeln"

const SPEICHER = "baerngo-inventar"
// Überlauf-Zwischenlager: was nicht mehr in die 36 Fächer passt, wartet
// hier und wird beim nächsten Laden wieder einsortiert — nichts geht verloren.
const STASH = "baerngo-uebertrag"

export type Inventar = Record<string, number>

export function useInventar() {
  const [slots, setSlots] = useState<InventarSlot[]>(leereSlots)

  useEffect(() => {
    function lade() {
      const geladen = leseSlots()
      const stash = leseStash()
      if (stash.length === 0) {
        setSlots(geladen)
        return
      }
      const gelegt = legeBeuteInSlotsMitRest(geladen, stash)
      schreibeStash(gelegt.rest)
      schreibeSlots(gelegt.slots)
      setSlots(gelegt.slots)
    }
    lade()
    // Nach einem bfcache-Comeback ist der React-Zustand älter als der
    // pagehide-Flush in localStorage — neu laden, sonst überschreibt
    // die nächste Änderung die gesicherten Items.
    const aufShow = (event: PageTransitionEvent) => {
      if (event.persisted) lade()
    }
    window.addEventListener("pageshow", aufShow)
    return () => window.removeEventListener("pageshow", aufShow)
  }, [])

  const inventar = useMemo(() => zaehleSlots(slots), [slots])

  const setzeSlots = useCallback((danach: InventarSlot[]) => {
    schreibeSlots(danach)
    setSlots(danach)
  }, [])

  const sammle = useCallback((ressourceId: string, anzahl = 1) => {
    setSlots((bisher) => {
      const danach = legeBeuteInSlots(bisher, [
        { gegenstandId: ressourceId, anzahl },
      ])
      schreibeSlots(danach)
      return danach
    })
  }, [])

  const sammleBeute = useCallback((beute: Beute[]) => {
    setSlots((bisher) => {
      const danach = legeBeuteInSlots(bisher, beute)
      schreibeSlots(danach)
      return danach
    })
  }, [])

  return { slots, inventar, sammle, sammleBeute, setzeSlots }
}

// Schreibt Beute synchron nach localStorage — für pagehide/Unmount,
// wenn kein React-Zyklus mehr sicher durchläuft. Was nicht passt,
// landet im Zwischenlager und kommt beim nächsten Start zurück.
export function sichereBeuteSofort(beute: Beute[]) {
  if (typeof window === "undefined" || beute.length === 0) return
  const gelegt = legeBeuteInSlotsMitRest(leseSlots(), beute)
  schreibeSlots(gelegt.slots)
  if (gelegt.rest.length > 0) {
    schreibeStash([...leseStash(), ...gelegt.rest])
  }
}

function leseSlots(): InventarSlot[] {
  if (typeof window === "undefined") return leereSlots()
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    return parseSlots(roh ? JSON.parse(roh) : [])
  } catch {
    return leereSlots()
  }
}

function schreibeSlots(slots: InventarSlot[]) {
  window.localStorage.setItem(SPEICHER, JSON.stringify(slots))
}

function leseStash(): Beute[] {
  try {
    const roh = window.localStorage.getItem(STASH)
    if (!roh) return []
    const wert = JSON.parse(roh) as unknown
    if (!Array.isArray(wert)) return []
    return wert.filter(
      (stuck): stuck is Beute =>
        Boolean(stuck) &&
        typeof (stuck as Beute).gegenstandId === "string" &&
        typeof (stuck as Beute).anzahl === "number" &&
        (stuck as Beute).anzahl > 0,
    )
  } catch {
    return []
  }
}

function schreibeStash(beute: Beute[]) {
  if (beute.length === 0) {
    window.localStorage.removeItem(STASH)
    return
  }
  window.localStorage.setItem(STASH, JSON.stringify(beute))
}
