"use client"

import { useCallback, useEffect, useState } from "react"

const SPEICHER = "baerngo-inventar"

export type Inventar = Record<string, number>

export function useInventar() {
  const [inventar, setInventar] = useState<Inventar>({})

  useEffect(() => {
    setInventar(leseInventar())
  }, [])

  const sammle = useCallback((ressourceId: string) => {
    setInventar((bisher) => {
      const danach = { ...bisher, [ressourceId]: (bisher[ressourceId] ?? 0) + 1 }
      schreibeInventar(danach)
      return danach
    })
  }, [])

  return { inventar, sammle }
}

function leseInventar(): Inventar {
  if (typeof window === "undefined") return {}
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    return roh ? (JSON.parse(roh) as Inventar) : {}
  } catch {
    return {}
  }
}

function schreibeInventar(inventar: Inventar) {
  window.localStorage.setItem(SPEICHER, JSON.stringify(inventar))
}
