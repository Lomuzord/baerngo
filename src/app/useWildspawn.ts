"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Lage } from "@/lib/katalog"
import type { Umwelt } from "@/lib/umwelt"
import {
  aktualisiereWild,
  entferneWildBlock,
  parseWildStand,
  type WildStand,
} from "@/lib/wildspawn"
import type { SpielerOrt } from "./useSpielerOrt"

const SPEICHER = "baerngo-wild-v14"

export function useWildspawn(
  spieler: SpielerOrt,
  umweltAn: ((lage: Lage) => Umwelt) | null,
  karteBereit = false,
) {
  const [stand, setStand] = useState<WildStand | null>(null)
  const standRef = useRef(stand)
  standRef.current = stand

  useEffect(() => {
    if (!umweltAn || spieler.status !== "bereit") return
    const lage = spieler.lage
    const jetzt = Date.now()
    setStand((bisher) => {
      const aktuell = bisher ?? leseWild()
      const next = aktualisiereWild(
        aktuell?.bloecke ?? [],
        lage,
        umweltAn,
        jetzt,
        spieler.blick,
        aktuell?.letzteSpawn,
        aktuell?.letzteSpawnZeit,
      )
      const danach: WildStand = {
        schluessel: `${lage.lat.toFixed(4)}:${lage.lng.toFixed(4)}`,
        bloecke: next.bloecke,
        letzteSpawn: next.letzteSpawn,
        letzteSpawnZeit: next.letzteSpawnZeit,
      }
      schreibeWild(danach)
      return danach
    })
  }, [spieler, umweltAn, karteBereit])

  const nimm = useCallback((id: string) => {
    const aktuell = standRef.current ?? leseWild()
    if (!aktuell) return undefined
    const weg = aktuell.bloecke.find((block) => block.id === id)
    if (!weg) return undefined
    const danach: WildStand = {
      schluessel: aktuell.schluessel,
      bloecke: entferneWildBlock(aktuell.bloecke, id),
      letzteSpawn: aktuell.letzteSpawn,
      letzteSpawnZeit: aktuell.letzteSpawnZeit,
    }
    standRef.current = danach
    schreibeWild(danach)
    setStand(danach)
    return weg
  }, [])

  return { bloecke: stand?.bloecke ?? [], nimm }
}

function leseWild(): WildStand | null {
  if (typeof window === "undefined") return null
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    return roh ? parseWildStand(JSON.parse(roh)) : null
  } catch {
    return null
  }
}

function schreibeWild(stand: WildStand) {
  window.localStorage.setItem(SPEICHER, JSON.stringify(stand))
}
