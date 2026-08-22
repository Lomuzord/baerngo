"use client"

import { useEffect, useRef } from "react"
import { gegenstandById, istSetzbar } from "@/lib/gegenstaende"
import { maleIsoWuerfel } from "./maleIsoWuerfel"

// Leichtgewichtige Item-Vorschau: Blöcke als 2D-Isowürfel, Werkzeuge
// und Gegenstände flach — bewusst OHNE WebGL, damit auf dem Handy
// keine Kontexte verbraucht werden (Limit ~8-16 pro Tab).
export function Block3D({
  gegenstandId,
  className,
}: {
  gegenstandId: string
  className?: string
}) {
  const buehne = useRef<HTMLSpanElement>(null)
  const item = gegenstandById(gegenstandId)
  const alsWuerfel = Boolean(item && istSetzbar(item.id))

  useEffect(() => {
    const el = buehne.current
    if (!el || !item || !alsWuerfel) return
    let stop: (() => void) | undefined
    let disposed = false
    const seite =
      item.id === "gras" ? "/bloecke/erde.png" : item.textur
    void maleIsoWuerfel(el, item.textur, seite).then((ende) => {
      if (disposed) ende()
      else stop = ende
    })
    return () => {
      disposed = true
      stop?.()
    }
    // item folgt aus gegenstandId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gegenstandId, alsWuerfel])

  if (item && !alsWuerfel) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.textur}
        alt=""
        draggable={false}
        className={`mc-block3d mc-block3d-flach ${className ?? ""}`.trim()}
      />
    )
  }

  return (
    <span
      ref={buehne}
      className={`mc-block3d ${className ?? ""}`.trim()}
    />
  )
}
