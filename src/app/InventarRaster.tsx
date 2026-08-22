"use client"

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ZeigerEvent,
} from "react"
import { gegenstandById } from "@/lib/gegenstaende"
import { spieleHaptik } from "@/lib/haptik"
import {
  HOTBAR_LAENGE,
  klickSlot,
  lagerVon,
  legeCursorZurueckMitRest,
  verschiebeSlot,
  type Cursor,
  type InventarSlot,
} from "@/lib/inventar"

export function InventarRaster({
  slots,
  onSlots,
  cursor,
  onCursor,
  wahlIndex = null,
  onWahl,
  onCraftDrop,
  klasse,
}: {
  slots: InventarSlot[]
  onSlots: (slots: InventarSlot[]) => void
  cursor: Cursor | null
  onCursor: (cursor: Cursor | null) => void
  wahlIndex?: number | null
  onWahl?: (index: number) => void
  onCraftDrop?: (index: number, cursor: Cursor | null) => Cursor | null
  klasse?: string
}) {
  const slotsRef = useRef(slots)
  slotsRef.current = slots
  const cursorRef = useRef(cursor)
  cursorRef.current = cursor
  const drag = useRef<{
    von: number
    x: number
    y: number
    aktiv: boolean
    quelle: "inv" | "craft"
  } | null>(null)
  const lang = useRef<number>(0)
  const gestenSperre = useRef(false)
  const ignoriereBis = useRef(0)
  const zeiger = useRef({ x: 0, y: 0 })
  const geist = useRef<HTMLDivElement>(null)
  // Auf Touch gibt es keinen Mauszeiger: solange der Finger unten ist,
  // folgt das Item dem Finger, danach liegt es sichtbar in der Ablage.
  const [amFinger, setAmFinger] = useState(false)

  useEffect(() => {
    function nimmVomStart(start: { von: number; quelle: "inv" | "craft" }) {
      if (cursorRef.current) return
      if (start.quelle === "craft") {
        if (!onCraftDrop) return
        cursorRef.current = onCraftDrop(start.von, null)
        onCursor(cursorRef.current)
        return
      }
      const r = klickSlot(slotsRef.current, start.von, null, "links")
      slotsRef.current = r.slots
      cursorRef.current = r.cursor
      onSlots(r.slots)
      onCursor(r.cursor)
    }

    const aufCraftDown = (event: PointerEvent) => {
      if (!onCraftDrop || event.button === 2) return
      if (!(event.target instanceof Element)) return
      const knopf = event.target.closest("[data-craft-slot]")
      if (!(knopf instanceof HTMLElement)) return
      const index = Number(knopf.dataset.craftSlot)
      if (!Number.isInteger(index) || index < 0) return
      if (index > 8 && (index < 20 || index > 22)) return
      event.preventDefault()
      knopf.setPointerCapture(event.pointerId)
      window.clearTimeout(lang.current)
      drag.current = {
        von: index,
        x: event.clientX,
        y: event.clientY,
        aktiv: false,
        quelle: "craft",
      }
      zeiger.current = { x: event.clientX, y: event.clientY }
      setAmFinger(true)
    }

    const aufMove = (event: PointerEvent) => {
      zeiger.current = { x: event.clientX, y: event.clientY }
      const el = geist.current
      if (el) {
        el.style.left = `${event.clientX}px`
        el.style.top = `${event.clientY}px`
      }
      const start = drag.current
      if (!start || start.aktiv) return
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 12) {
        return
      }
      window.clearTimeout(lang.current)
      start.aktiv = true
      nimmVomStart(start)
    }
    const aufUp = (event: PointerEvent) => {
      window.clearTimeout(lang.current)
      setAmFinger(false)
      if (gestenSperre.current) {
        gestenSperre.current = false
        drag.current = null
        return
      }
      if (performance.now() < ignoriereBis.current) {
        drag.current = null
        return
      }
      const start = drag.current
      drag.current = null
      const ziel = slotAnPunkt(event.clientX, event.clientY)
      const craft = ziel == null ? craftAnPunkt(event.clientX, event.clientY) : null

      if (start && !start.aktiv) {
        const woanders =
          start.quelle === "craft"
            ? craft !== start.von || ziel != null
            : ziel !== start.von || craft != null
        if (woanders) nimmVomStart(start)
      }

      if (craft != null && onCraftDrop) {
        if (start?.quelle === "inv") nimmVomStart(start)
        // Nur mit Item in der Hand oder einem Drag aus dem Raster —
        // ein leerer Tipp neben dem Raster darf über den Näherungs-
        // Fallback keine Zelle leerräumen.
        if (cursorRef.current || start?.quelle === "craft") {
          cursorRef.current = onCraftDrop(craft, cursorRef.current)
          onCursor(cursorRef.current)
          return
        }
      }

      if (start?.quelle === "craft") {
        if (ziel != null) {
          nimmVomStart(start)
          if (cursorRef.current) {
            const r = klickSlot(
              slotsRef.current,
              ziel,
              cursorRef.current,
              "links",
            )
            slotsRef.current = r.slots
            cursorRef.current = r.cursor
            onSlots(r.slots)
            onCursor(r.cursor)
          }
          return
        }
        if (start.aktiv && cursorRef.current) {
          const r = legeCursorZurueckMitRest(slotsRef.current, cursorRef.current)
          slotsRef.current = r.slots
          cursorRef.current = r.cursor
          onSlots(r.slots)
          onCursor(r.cursor)
          return
        }
        if (onCraftDrop) {
          cursorRef.current = onCraftDrop(start.von, cursorRef.current)
          onCursor(cursorRef.current)
        }
        return
      }

      if (!start) {
        if (cursorRef.current && ziel != null) {
          const r = klickSlot(slotsRef.current, ziel, cursorRef.current, "links")
          slotsRef.current = r.slots
          cursorRef.current = r.cursor
          onSlots(r.slots)
          onCursor(r.cursor)
          return
        }
        if (cursorRef.current && ziel == null && !istAblage(event)) {
          const r = legeCursorZurueckMitRest(slotsRef.current, cursorRef.current)
          slotsRef.current = r.slots
          cursorRef.current = r.cursor
          onSlots(r.slots)
          onCursor(r.cursor)
        }
        return
      }
      if (start.aktiv) {
        if (ziel == null) {
          const r = legeCursorZurueckMitRest(
            slotsRef.current,
            cursorRef.current,
            start.von,
          )
          slotsRef.current = r.slots
          cursorRef.current = r.cursor
          onSlots(r.slots)
          onCursor(r.cursor)
          return
        }
        if (cursorRef.current) {
          const r = klickSlot(slotsRef.current, ziel, cursorRef.current, "links")
          slotsRef.current = r.slots
          cursorRef.current = r.cursor
          onSlots(r.slots)
          onCursor(r.cursor)
          return
        }
        onSlots(verschiebeSlot(slotsRef.current, start.von, ziel))
        return
      }
      if (ziel !== start.von) {
        if (!cursorRef.current) return
        if (ziel != null) {
          const r = klickSlot(slotsRef.current, ziel, cursorRef.current, "links")
          slotsRef.current = r.slots
          cursorRef.current = r.cursor
          onSlots(r.slots)
          onCursor(r.cursor)
          return
        }
        const r = legeCursorZurueckMitRest(
          slotsRef.current,
          cursorRef.current,
          start.von,
        )
        slotsRef.current = r.slots
        cursorRef.current = r.cursor
        onSlots(r.slots)
        onCursor(r.cursor)
        return
      }
      if (onWahl && !cursorRef.current) {
        onWahl(start.von)
        return
      }
      const r = klickSlot(slotsRef.current, start.von, cursorRef.current, "links")
      slotsRef.current = r.slots
      cursorRef.current = r.cursor
      onSlots(r.slots)
      onCursor(r.cursor)
    }
    window.addEventListener("pointerdown", aufCraftDown)
    window.addEventListener("pointermove", aufMove)
    window.addEventListener("pointerup", aufUp)
    window.addEventListener("pointercancel", aufUp)
    return () => {
      window.removeEventListener("pointerdown", aufCraftDown)
      window.removeEventListener("pointermove", aufMove)
      window.removeEventListener("pointerup", aufUp)
      window.removeEventListener("pointercancel", aufUp)
      // Ein überlebender Langdruck-Timer würde mit veralteten Slots
      // in die gerade gesicherten Daten schreiben.
      window.clearTimeout(lang.current)
    }
  }, [onCursor, onSlots, onWahl, onCraftDrop])

  function rechtsKlick(index: number) {
    ignoriereBis.current = performance.now() + 400
    const r = klickSlot(slotsRef.current, index, cursorRef.current, "rechts")
    slotsRef.current = r.slots
    cursorRef.current = r.cursor
    onSlots(r.slots)
    onCursor(r.cursor)
    spieleHaptik("tipp")
  }

  function aufDown(index: number, event: ZeigerEvent) {
    if (event.button === 2) {
      event.preventDefault()
      rechtsKlick(index)
      return
    }
    event.preventDefault()
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    drag.current = {
      von: index,
      x: event.clientX,
      y: event.clientY,
      aktiv: false,
      quelle: "inv",
    }
    zeiger.current = { x: event.clientX, y: event.clientY }
    setAmFinger(true)
    lang.current = window.setTimeout(() => {
      if (!drag.current || drag.current.aktiv) return
      drag.current = null
      gestenSperre.current = true
      rechtsKlick(index)
    }, 420)
  }

  const lager = lagerVon(slots)
  const held = cursor ? gegenstandById(cursor.id) : null

  return (
    <div className={`mc-inv-fenster ${klasse ?? ""}`.trim()}>
      <ol className="mc-lager" aria-label="Inventar">
        {lager.map((slot, i) => (
          <SlotKnopf
            key={`lager-${i}`}
            slot={slot}
            index={HOTBAR_LAENGE + i}
            aktiv={wahlIndex === HOTBAR_LAENGE + i}
            onDown={aufDown}
            onRechts={rechtsKlick}
          />
        ))}
      </ol>
      <ol className="mc-hotbar-raster" aria-label="Hotbar">
        {slots.slice(0, HOTBAR_LAENGE).map((slot, i) => (
          <SlotKnopf
            key={`hotbar-${i}`}
            slot={slot}
            index={i}
            aktiv={wahlIndex === i}
            onDown={aufDown}
            onRechts={rechtsKlick}
          />
        ))}
      </ol>
      {held && cursor && amFinger ? (
        <div
          ref={geist}
          className="mc-cursor"
          style={{ left: zeiger.current.x, top: zeiger.current.y }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={held.textur} alt="" draggable={false} className="mc-slot-block" />
          {cursor.anzahl > 1 ? (
            <span className="mc-slot-count">{cursor.anzahl}</span>
          ) : null}
        </div>
      ) : null}
      {held && cursor && !amFinger ? (
        <div className="mc-hand-ablage" aria-live="polite">
          <span className="mc-slot mc-hand-slot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={held.textur}
              alt=""
              draggable={false}
              className="mc-slot-block"
            />
            {cursor.anzahl > 1 ? (
              <span className="mc-slot-count">{cursor.anzahl}</span>
            ) : null}
          </span>
          <span className="mc-hand-text">
            {held.name} in der Hand — tippe ein Fach
          </span>
        </div>
      ) : null}
    </div>
  )
}

function SlotKnopf({
  slot,
  index,
  aktiv,
  onDown,
  onRechts,
}: {
  slot: InventarSlot
  index: number
  aktiv: boolean
  onDown: (index: number, event: ZeigerEvent) => void
  onRechts: (index: number) => void
}) {
  const item = slot ? gegenstandById(slot.id) : null
  return (
    <li>
      <button
        type="button"
        className={aktiv ? "mc-slot mc-slot-wahl" : "mc-slot"}
        data-inv-slot={index}
        aria-label={item && slot ? `${item.name} ×${slot.anzahl}` : "Leer"}
        onPointerDown={(event) => onDown(index, event)}
        onContextMenu={(event) => {
          event.preventDefault()
        }}
      >
        {item ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.textur} alt="" draggable={false} className="mc-slot-block" />
        ) : null}
        {slot && slot.anzahl > 1 ? (
          <span className="mc-slot-count">{slot.anzahl}</span>
        ) : null}
      </button>
    </li>
  )
}

function istAblage(event: PointerEvent): boolean {
  const ziel = event.target
  if (!(ziel instanceof Element)) return false
  return Boolean(
    ziel.closest("[data-craft-slot], .mc-out-slot, .mc-rezept, .mc-btn"),
  )
}

function craftAnPunkt(x: number, y: number): number | null {
  const treffer = document.elementsFromPoint(x, y)
  for (const el of treffer) {
    if (!(el instanceof HTMLElement)) continue
    const knopf = el.closest("[data-craft-slot]")
    if (!(knopf instanceof HTMLElement)) continue
    const index = Number(knopf.dataset.craftSlot)
    if (Number.isInteger(index) && index >= 0 && index < 9) return index
    if (Number.isInteger(index) && index >= 20 && index < 23) return index
  }
  let best: number | null = null
  let bestDist = 36
  for (const knopf of document.querySelectorAll("[data-craft-slot]")) {
    if (!(knopf instanceof HTMLElement)) continue
    const box = knopf.getBoundingClientRect()
    const dist = Math.hypot(x - (box.left + box.width / 2), y - (box.top + box.height / 2))
    if (dist < bestDist) {
      bestDist = dist
      const index = Number(knopf.dataset.craftSlot)
      if (
        Number.isInteger(index) &&
        ((index >= 0 && index < 9) || (index >= 20 && index < 23))
      ) {
        best = index
      }
    }
  }
  return best
}

function slotAnPunkt(x: number, y: number): number | null {
  const treffer = document.elementsFromPoint(x, y)
  for (const el of treffer) {
    if (!(el instanceof HTMLElement)) continue
    const knopf = el.closest("[data-inv-slot]")
    if (!(knopf instanceof HTMLElement)) continue
    const index = Number(knopf.dataset.invSlot)
    if (Number.isInteger(index)) return index
  }
  return null
}
