"use client"

import { useEffect, useRef } from "react"
import type { SichtMesh } from "@/lib/modelle"
import { starteModellSzene } from "./starteModellSzene"

export function ModellBuehne({
  mesh,
  klasse,
}: {
  mesh: SichtMesh
  klasse?: string
}) {
  const kasten = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = kasten.current
    if (!el) return
    let disposed = false
    let stop: (() => void) | undefined

    void starteModellSzene(el, mesh).then((ende) => {
      if (disposed) ende()
      else stop = ende
    })

    return () => {
      disposed = true
      stop?.()
    }
  }, [mesh.src, mesh.textur])

  return (
    <div className={`mc-modell ${klasse ?? ""}`.trim()}>
      <div ref={kasten} className="mc-modell-canvas" />
      <p className="mc-modell-credit">{mesh.credit}</p>
    </div>
  )
}
