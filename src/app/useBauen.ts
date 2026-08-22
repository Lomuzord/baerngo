"use client"

import { useCallback, useEffect, useState } from "react"
import {
  nimmBlock,
  parseBloecke,
  setzeBlock,
  type GesetzterBlock,
} from "@/lib/bauen"
import type { Zelle } from "@/lib/spielflaeche"

const SPEICHER = "baerngo-bauen"

export function useBauen() {
  const [bloecke, setBloecke] = useState<GesetzterBlock[]>([])

  useEffect(() => {
    setBloecke(leseBloecke())
  }, [])

  const setze = useCallback((gegenstandId: string, zelle: Zelle) => {
    setBloecke((bisher) => {
      const danach = setzeBlock(bisher, gegenstandId, zelle)
      schreibeBloecke(danach)
      return danach
    })
  }, [])

  const nimmWeg = useCallback((blockId: string) => {
    setBloecke((bisher) => {
      const danach = nimmBlock(bisher, blockId)
      schreibeBloecke(danach)
      return danach
    })
  }, [])

  return { bloecke, setze, nimmWeg }
}

function leseBloecke(): GesetzterBlock[] {
  if (typeof window === "undefined") return []
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    return parseBloecke(roh ? JSON.parse(roh) : [])
  } catch {
    return []
  }
}

function schreibeBloecke(bloecke: GesetzterBlock[]) {
  window.localStorage.setItem(SPEICHER, JSON.stringify(bloecke))
}
