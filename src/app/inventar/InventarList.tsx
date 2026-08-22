"use client"

import { useEffect, useRef, useState } from "react"
import { anzeigeHaltbarkeit } from "@/lib/abbauen"
import { gegenstandById } from "@/lib/gegenstaende"
import type { Cursor } from "@/lib/inventar"
import { InventarRaster } from "../InventarRaster"
import { sichereBeuteSofort, useInventar } from "../useInventar"
import { usePickel } from "../usePickel"

export function InventarList() {
  const { slots, inventar, setzeSlots } = useInventar()
  const { haltbarkeit, maximum } = usePickel()
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const cursorRef = useRef(cursor)
  cursorRef.current = cursor

  useEffect(() => {
    // Auch wenn die App vom System gekillt wird (pagehide), darf das
    // Item "in der Hand" nicht verloren gehen.
    function sichere() {
      const held = cursorRef.current
      if (!held) return
      cursorRef.current = null
      sichereBeuteSofort([{ gegenstandId: held.id, anzahl: held.anzahl }])
      setCursor(null)
    }
    window.addEventListener("pagehide", sichere)
    return () => {
      window.removeEventListener("pagehide", sichere)
      sichere()
    }
  }, [])

  const name = cursor ? gegenstandById(cursor.id)?.name : null

  return (
    <section className="mc-panel">
      <h1 className="mc-title">Inventar</h1>
      {(inventar.pickel ?? 0) > 0 ? (
        <p className="mc-pickel-bar">
          Pickel {anzeigeHaltbarkeit(haltbarkeit, inventar.pickel ?? 0)}/
          {maximum}
        </p>
      ) : null}
      <InventarRaster
        slots={slots}
        onSlots={setzeSlots}
        cursor={cursor}
        onCursor={setCursor}
      />
      {name && cursor ? (
        <p className="mc-held-name">
          {name}
          {cursor.anzahl > 1 ? ` ×${cursor.anzahl}` : ""}
        </p>
      ) : null}
    </section>
  )
}
