"use client"

import { useCallback, useEffect, useState } from "react"
import { pickelHaltbarkeitFuer } from "@/lib/abbauen"

const SPEICHER = "baerngo-pickel"

export function usePickel() {
  const [stand, setStand] = useState<Record<string, number>>({})

  useEffect(() => {
    setStand(leseStand())
  }, [])

  const setzeHaltbarkeitFuer = useCallback((id: string, wert: number) => {
    setStand((bisher) => {
      const danach = { ...bisher, [id]: wert }
      schreibeStand(danach)
      return danach
    })
  }, [])

  const haltbarkeitFuer = useCallback(
    (id: string) => stand[id] ?? 0,
    [stand],
  )

  return {
    haltbarkeitFuer,
    setzeHaltbarkeitFuer,
    maximumFuer: pickelHaltbarkeitFuer,
    // Kompatible Sicht auf die Steinspitzhacke
    haltbarkeit: stand.pickel ?? 0,
    setzeHaltbarkeit: useCallback(
      (wert: number) => setzeHaltbarkeitFuer("pickel", wert),
      [setzeHaltbarkeitFuer],
    ),
    maximum: pickelHaltbarkeitFuer("pickel"),
  }
}

function leseStand(): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    if (!roh) return {}
    const wert = JSON.parse(roh) as unknown
    if (typeof wert === "number") return { pickel: wert }
    if (wert && typeof wert === "object" && !Array.isArray(wert)) {
      const stand: Record<string, number> = {}
      for (const [id, zahl] of Object.entries(wert as Record<string, unknown>)) {
        if (typeof zahl === "number" && Number.isFinite(zahl) && zahl > 0) {
          stand[id] = Math.floor(zahl)
        }
      }
      return stand
    }
    return {}
  } catch {
    // Alte Speicherform war eine blanke Zahl ohne JSON
    const roh = window.localStorage.getItem(SPEICHER)
    const zahl = roh ? Number(roh) : 0
    return Number.isFinite(zahl) && zahl > 0 ? { pickel: zahl } : {}
  }
}

function schreibeStand(stand: Record<string, number>) {
  window.localStorage.setItem(SPEICHER, JSON.stringify(stand))
}
