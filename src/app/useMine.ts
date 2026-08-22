"use client"

import { useCallback, useEffect, useState } from "react"
import {
  baueAb,
  grabTiefe,
  naechsteSchicht,
  parseMine,
} from "@/lib/mine"
import { EBENE_RADIUS_ZELLEN } from "@/lib/spielflaeche"

const SPEICHER = "baerngo-mine"

export function useMine() {
  const [abgebaut, setAbgebaut] = useState<string[]>([])

  useEffect(() => {
    try {
      const roh = window.localStorage.getItem(SPEICHER)
      setAbgebaut(parseMine(roh ? JSON.parse(roh) : []))
    } catch {
      setAbgebaut([])
    }
  }, [])

  const naechsteFuer = useCallback(
    (ix: number, iz: number) => naechsteSchicht(abgebaut, ix, iz),
    [abgebaut],
  )

  const grabe = useCallback(
    (ix: number, iz: number) => {
      const ergebnis = baueAb(abgebaut, ix, iz)
      if (!ergebnis) return null
      setAbgebaut(ergebnis.abgebaut)
      window.localStorage.setItem(
        SPEICHER,
        JSON.stringify(ergebnis.abgebaut),
      )
      return { tiefe: ergebnis.tiefe, art: ergebnis.art }
    },
    [abgebaut],
  )

  // Alle angegrabenen Spalten mit ihrer Tiefe — für die Gruben-Optik
  const spalten = (() => {
    const liste: { ix: number; iz: number; tiefe: number }[] = []
    for (let ix = -EBENE_RADIUS_ZELLEN; ix <= EBENE_RADIUS_ZELLEN; ix++) {
      for (let iz = -EBENE_RADIUS_ZELLEN; iz <= EBENE_RADIUS_ZELLEN; iz++) {
        const tiefe = grabTiefe(abgebaut, ix, iz)
        if (tiefe > 0) liste.push({ ix, iz, tiefe })
      }
    }
    return liste
  })()

  return { abgebaut, spalten, naechsteFuer, grabe }
}
