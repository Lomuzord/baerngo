"use client"

import { useCallback, useEffect, useState } from "react"
import { PICKEL_HALTBARKEIT } from "@/lib/abbauen"

const SPEICHER = "baerngo-pickel"

export function usePickel() {
  const [haltbarkeit, setHaltbarkeit] = useState(0)

  useEffect(() => {
    setHaltbarkeit(leseHaltbarkeit())
  }, [])

  const setzeHaltbarkeit = useCallback((danach: number) => {
    schreibeHaltbarkeit(danach)
    setHaltbarkeit(danach)
  }, [])

  return {
    haltbarkeit,
    setzeHaltbarkeit,
    maximum: PICKEL_HALTBARKEIT,
  }
}

function leseHaltbarkeit(): number {
  if (typeof window === "undefined") return 0
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    return roh ? Number(roh) || 0 : 0
  } catch {
    return 0
  }
}

function schreibeHaltbarkeit(wert: number) {
  window.localStorage.setItem(SPEICHER, String(wert))
}
