"use client"

import { useCallback, useEffect, useState } from "react"
import {
  boostRestMs,
  iss,
  parseBoost,
  radiusFaktor,
  spawnBonus,
  type Boost,
} from "@/lib/essen"

const SPEICHER = "baerngo-boost"
export const BOOST_EREIGNIS = "baerngo-boost"

export function leseBoost(): Boost | null {
  if (typeof window === "undefined") return null
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    return parseBoost(roh ? JSON.parse(roh) : null)
  } catch {
    return null
  }
}

// Startet den Boost eines gegessenen Gegenstands.
export function esseGegenstand(id: string): Boost | null {
  const danach = iss(leseBoost(), id, Date.now())
  if (!danach) return null
  window.localStorage.setItem(SPEICHER, JSON.stringify(danach))
  window.dispatchEvent(new Event(BOOST_EREIGNIS))
  return danach
}

export function useBoost() {
  const [boost, setBoost] = useState<Boost | null>(null)
  const [jetzt, setJetzt] = useState(() => Date.now())

  useEffect(() => {
    const lies = () => {
      setBoost(leseBoost())
      setJetzt(Date.now())
    }
    lies()
    window.addEventListener(BOOST_EREIGNIS, lies)
    window.addEventListener("focus", lies)
    return () => {
      window.removeEventListener(BOOST_EREIGNIS, lies)
      window.removeEventListener("focus", lies)
    }
  }, [])

  // Ticker läuft nur, solange ein Boost aktiv ist
  useEffect(() => {
    if (boostRestMs(boost, Date.now()) <= 0) return
    const timer = window.setInterval(() => setJetzt(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [boost, jetzt])

  const faktor = useCallback(() => radiusFaktor(boost, Date.now()), [boost])
  const bonus = useCallback(() => spawnBonus(boost, Date.now()), [boost])

  return { boost, jetzt, faktor, bonus, restMs: boostRestMs(boost, jetzt) }
}
