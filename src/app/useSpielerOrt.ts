"use client"

import { useEffect, useState } from "react"
import type { Lage } from "@/lib/katalog"

export type SpielerOrt =
  | { status: "suche" }
  | { status: "bereit"; lage: Lage }
  | { status: "verweigert" }
  | { status: "fehler" }

export function useSpielerOrt(): SpielerOrt {
  const [ort, setOrt] = useState<SpielerOrt>({ status: "suche" })

  useEffect(() => {
    if (!navigator.geolocation) {
      setOrt({ status: "fehler" })
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setOrt({
          status: "bereit",
          lage: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        })
      },
      (error) => {
        setOrt({
          status: error.code === error.PERMISSION_DENIED ? "verweigert" : "fehler",
        })
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return ort
}
