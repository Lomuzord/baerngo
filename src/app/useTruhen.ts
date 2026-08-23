"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { meldeTagesEreignis } from "./tagesEreignis"
import {
  entsperreTruhe,
  oeffneTruhe,
  parseTruheStand,
  truhePauseRestMs,
  truheStatus,
  type TruheStand,
  type TruheStatus,
} from "@/lib/truhe"

const SPEICHER = "baerngo-truhen"

export function useTruhen() {
  const [stand, setStand] = useState<TruheStand>({})
  const [jetzt, setJetzt] = useState(() => Date.now())
  const standRef = useRef(stand)
  standRef.current = stand

  useEffect(() => {
    const gelesen = leseTruhen()
    standRef.current = gelesen
    setStand(gelesen)
    setJetzt(Date.now())
  }, [])

  useEffect(() => {
    const laengste = Math.max(
      0,
      ...Object.keys(stand).map((id) => truhePauseRestMs(stand, id, jetzt)),
    )
    if (laengste <= 0) return
    // Der Ticker hört von selbst auf, sobald die letzte Pause abgelaufen ist,
    // statt für immer viermal pro Sekunde neu zu rendern.
    const timer = window.setInterval(() => setJetzt(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [stand, jetzt])

  const entsperre = useCallback((id: string) => {
    // Wichtig: die Vergleichszeit mitziehen. Sonst liegt der frische
    // Zeitstempel "in der Zukunft" gegenüber dem alten jetzt-Wert und
    // die Truhe gilt sofort wieder als verschlossen.
    setJetzt(Date.now())
    setStand((bisher) => {
      const danach = entsperreTruhe(bisher, id)
      standRef.current = danach
      schreibeTruhen(danach)
      return danach
    })
  }, [])

  const oeffne = useCallback((id: string) => {
    const jetztEcht = Date.now()
    const result = oeffneTruhe(standRef.current, id, jetztEcht)
    if (!result.geoeffnet) return false
    meldeTagesEreignis("truhe", 1)
    standRef.current = result.stand
    schreibeTruhen(result.stand)
    setJetzt(jetztEcht)
    setStand(result.stand)
    return true
  }, [])

  const statusFuer = useCallback(
    (id: string): TruheStatus => truheStatus(stand, id, jetzt),
    [stand, jetzt],
  )

  const restMsFuer = useCallback(
    (id: string) => truhePauseRestMs(stand, id, jetzt),
    [stand, jetzt],
  )

  return { stand, statusFuer, restMsFuer, entsperre, oeffne }
}

function leseTruhen(): TruheStand {
  if (typeof window === "undefined") return {}
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    return parseTruheStand(roh ? JSON.parse(roh) : {})
  } catch {
    return {}
  }
}

function schreibeTruhen(stand: TruheStand) {
  window.localStorage.setItem(SPEICHER, JSON.stringify(stand))
}
