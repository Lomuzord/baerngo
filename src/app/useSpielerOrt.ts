"use client"

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Lage } from "@/lib/katalog"
import { distanzMeter, naechsterBlick } from "@/lib/reichweite"

const SPEICHER = "baerngo-letzte-lage"

export type SpielerOrt =
  | { status: "suche" }
  | {
      status: "bereit"
      lage: Lage
      genauigkeit?: number
      blick?: number
      geht?: boolean
    }
  | { status: "verweigert" }
  | { status: "fehler" }

const SpielerOrtContext = createContext<SpielerOrt | null>(null)

export function SpielerOrtProvider({
  wert,
  children,
}: {
  wert: SpielerOrt
  children: ReactNode
}) {
  return createElement(SpielerOrtContext.Provider, { value: wert }, children)
}

// Ein Bauteil unter einem SpielerOrtProvider teilt dessen GPS-Abo;
// ohne Provider startet es sein eigenes watchPosition.
export function useSpielerOrt(): SpielerOrt {
  const geteilt = useContext(SpielerOrtContext)
  const eigen = useSpielerOrtQuelle(geteilt === null)
  return geteilt ?? eigen
}

function useSpielerOrtQuelle(aktiv: boolean): SpielerOrt {
  const [ort, setOrt] = useState<SpielerOrt>(leseLetzteLage)

  useEffect(() => {
    if (!aktiv) return
    if (!navigator.geolocation) {
      setOrt({ status: "fehler" })
      return
    }

    const cache = leseCacheEintrag()
    let letzterBlick: number | undefined
    let letzteLage: Lage | undefined = cache?.lage
    let hatFix = Boolean(cache)
    // Das echte Alter des Cache zählt — sonst überdeckt ein 9 Minuten
    // alter Fix weitere 2 Minuten lang jeden GPS-Fehler.
    let letzterFix = cache?.zeit ?? 0
    let letzteAnzeige: Lage | undefined = cache?.lage
    let gehtBis = 0
    if (cache) setOrt({ status: "bereit", lage: cache.lage })

    function uebernimm(position: GeolocationPosition) {
      const lage = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
      const geraet =
        typeof position.coords.heading === "number" &&
        Number.isFinite(position.coords.heading)
          ? position.coords.heading
          : undefined
      const schritt = naechsterBlick({
        bisher: letzterBlick,
        von: letzteLage,
        nach: lage,
        geraet,
        geschwindigkeit: position.coords.speed ?? undefined,
        genauigkeit: position.coords.accuracy ?? undefined,
      })
      if (schritt.schritt) {
        letzterBlick = schritt.blick
        gehtBis = Date.now() + 2_400
        letzteLage = lage
      } else if (!letzteLage) {
        letzteLage = lage
      }
      // Sichtbare Bewegung = Schritte: sobald sich die angezeigte
      // Position spürbar verschiebt, laufen auch Steves Beine —
      // sonst gleitet er wie fliegend über die Karte.
      if (
        letzteAnzeige &&
        distanzMeter(letzteAnzeige, lage) > 0.8
      ) {
        gehtBis = Date.now() + 2_400
      }
      letzteAnzeige = lage
      hatFix = true
      letzterFix = Date.now()
      schreibeLetzteLage(lage)
      setOrt({
        status: "bereit",
        lage,
        genauigkeit: position.coords.accuracy,
        blick: letzterBlick,
        geht: Date.now() < gehtBis,
      })
    }

    navigator.geolocation.getCurrentPosition(
      uebernimm,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          hatFix = false
          setOrt({ status: "verweigert" })
          return
        }
        if (hatFix) return
        setOrt({ status: "suche" })
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    )

    const watchId = navigator.geolocation.watchPosition(
      uebernimm,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          hatFix = false
          setOrt({ status: "verweigert" })
          return
        }
        // Ein alter Fix darf GPS-Ausfälle nicht ewig überdecken:
        // Nach 2 Minuten ohne frische Position gilt der Standort als weg.
        if (hatFix && Date.now() - letzterFix < 120_000) return
        hatFix = false
        setOrt({ status: "fehler" })
      },
      { enableHighAccuracy: true, maximumAge: 1_000, timeout: 60_000 },
    )

    const tick = window.setInterval(() => {
      setOrt((bisher) => {
        if (bisher.status !== "bereit" || !bisher.geht) return bisher
        if (Date.now() < gehtBis) return bisher
        return { ...bisher, geht: false }
      })
    }, 400)

    return () => {
      navigator.geolocation.clearWatch(watchId)
      window.clearInterval(tick)
    }
  }, [aktiv])

  return ort
}

const CACHE_MAX_ALTER_MS = 10 * 60 * 1000

function leseLetzteLage(): SpielerOrt {
  const eintrag = leseCacheEintrag()
  return eintrag
    ? { status: "bereit", lage: eintrag.lage }
    : { status: "suche" }
}

function leseCacheEintrag(): { lage: Lage; zeit: number } | null {
  if (typeof window === "undefined") return null
  try {
    const roh = window.sessionStorage.getItem(SPEICHER)
    if (!roh) return null
    const wert = JSON.parse(roh) as Lage & { zeit?: number }
    if (typeof wert.lat !== "number" || typeof wert.lng !== "number") {
      return null
    }
    // Cache ohne oder mit altem Zeitstempel nicht mehr als Fix werten —
    // sonst spielt man nach einer Tramfahrt am falschen Ort weiter.
    if (
      typeof wert.zeit !== "number" ||
      Date.now() - wert.zeit > CACHE_MAX_ALTER_MS
    ) {
      return null
    }
    return { lage: { lat: wert.lat, lng: wert.lng }, zeit: wert.zeit }
  } catch {
    return null
  }
}

function schreibeLetzteLage(lage: Lage) {
  window.sessionStorage.setItem(
    SPEICHER,
    JSON.stringify({ ...lage, zeit: Date.now() }),
  )
}
