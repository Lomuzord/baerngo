"use client"

import { useEffect, useRef } from "react"
import { starteTruheSzene } from "./starteTruheSzene"

export function Truhe3D({
  offen,
  bereit,
}: {
  offen: boolean
  bereit: boolean
}) {
  const kasten = useRef<HTMLDivElement>(null)
  const zustand = useRef({ offen, bereit })
  zustand.current = { offen, bereit }

  useEffect(() => {
    const el = kasten.current
    if (!el) return
    let disposed = false
    let stop: (() => void) | undefined

    void starteTruheSzene(el, () => zustand.current).then((ende) => {
      if (disposed) ende()
      else stop = ende
    })

    return () => {
      disposed = true
      stop?.()
    }
  }, [])

  return <div ref={kasten} className="mc-truhe3d-canvas" />
}
