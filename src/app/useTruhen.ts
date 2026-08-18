"use client"

import { useCallback, useEffect, useState } from "react"
import {
  entsperreTruhe,
  oeffneTruhe,
  truheStatus,
  type TruheStand,
  type TruheStatus,
} from "@/lib/truhe"

const SPEICHER = "baerngo-truhen"

export function useTruhen() {
  const [stand, setStand] = useState<TruheStand>({})

  useEffect(() => {
    setStand(leseTruhen())
  }, [])

  const entsperre = useCallback((id: string) => {
    setStand((bisher) => {
      const danach = entsperreTruhe(bisher, id)
      schreibeTruhen(danach)
      return danach
    })
  }, [])

  const oeffne = useCallback(
    (id: string) => {
      const result = oeffneTruhe(stand, id)
      if (!result.geoeffnet) return false
      schreibeTruhen(result.stand)
      setStand(result.stand)
      return true
    },
    [stand],
  )

  const statusFuer = useCallback(
    (id: string): TruheStatus => truheStatus(stand, id),
    [stand],
  )

  return { stand, statusFuer, entsperre, oeffne }
}

function leseTruhen(): TruheStand {
  if (typeof window === "undefined") return {}
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    return roh ? (JSON.parse(roh) as TruheStand) : {}
  } catch {
    return {}
  }
}

function schreibeTruhen(stand: TruheStand) {
  window.localStorage.setItem(SPEICHER, JSON.stringify(stand))
}
