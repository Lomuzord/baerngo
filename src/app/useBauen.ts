"use client"

import { useCallback, useEffect, useState } from "react"
import { neuerBlock, type GesetzterBlock } from "@/lib/bauen"

const SPEICHER = "baerngo-bauen"

export function useBauen() {
  const [bloecke, setBloecke] = useState<GesetzterBlock[]>([])

  useEffect(() => {
    setBloecke(leseBloecke())
  }, [])

  const setze = useCallback((gegenstandId: string, lat: number, lng: number) => {
    const block = neuerBlock(gegenstandId, lat, lng)
    setBloecke((bisher) => {
      const danach = [...bisher, block]
      schreibeBloecke(danach)
      return danach
    })
    return block
  }, [])

  return { bloecke, setze }
}

function leseBloecke(): GesetzterBlock[] {
  if (typeof window === "undefined") return []
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    return roh ? (JSON.parse(roh) as GesetzterBlock[]) : []
  } catch {
    return []
  }
}

function schreibeBloecke(bloecke: GesetzterBlock[]) {
  window.localStorage.setItem(SPEICHER, JSON.stringify(bloecke))
}
