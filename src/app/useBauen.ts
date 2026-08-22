"use client"

import { useCallback, useEffect, useState } from "react"
import {
  nimmBlock,
  parseBloecke,
  setzeBlock,
  type GesetzterBlock,
} from "@/lib/bauen"
import { wendeWachstumAn } from "@/lib/wachstum"
import type { Zelle } from "@/lib/spielflaeche"

const SPEICHER = "baerngo-bauen"

export function useBauen() {
  const [bloecke, setBloecke] = useState<GesetzterBlock[]>([])

  useEffect(() => {
    setBloecke(wendeWachstumAn(leseBloecke(), Date.now()))
    // Setzlinge und Samen wachsen nach echter Zeit weiter
    const timer = window.setInterval(() => {
      setBloecke((bisher) => {
        const danach = wendeWachstumAn(bisher, Date.now())
        if (danach === bisher) return bisher
        schreibeBloecke(danach)
        return danach
      })
    }, 15_000)
    return () => window.clearInterval(timer)
  }, [])

  const setze = useCallback((gegenstandId: string, zelle: Zelle) => {
    setBloecke((bisher) => {
      const danach = setzeBlock(bisher, gegenstandId, zelle)
      schreibeBloecke(danach)
      return danach
    })
  }, [])

  // Tauscht die Art eines Blocks an Ort und Stelle — z. B. Hacke
  // verwandelt Erde in Ackerboden.
  const ersetze = useCallback((blockId: string, gegenstandId: string) => {
    setBloecke((bisher) => {
      const danach = bisher.map((block) =>
        block.id === blockId ? { ...block, gegenstandId } : block,
      )
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

  return { bloecke, setze, nimmWeg, ersetze }
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
