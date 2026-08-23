"use client"

import { albumGegenstaende, parseAlbum } from "@/lib/album"
import { essenArt, istEssen } from "@/lib/essen"
import { spieleHaptik } from "@/lib/haptik"
import { esseGegenstand } from "../useBoost"
import { BRUNNEN, parseBrunnenStand } from "@/lib/brunnen"
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

  const [essenHinweis, setEssenHinweis] = useState("")
  useEffect(() => {
    if (!essenHinweis) return
    const timer = window.setTimeout(() => setEssenHinweis(""), 3500)
    return () => window.clearTimeout(timer)
  }, [essenHinweis])
  const [brunnenGesammelt, setBrunnenGesammelt] = useState<string[]>([])
  const [entdeckt, setEntdeckt] = useState<Set<string>>(new Set())
  useEffect(() => {
    const lies = () => {
      try {
        const roh = window.localStorage.getItem("baerngo-album")
        setEntdeckt(new Set(parseAlbum(roh ? JSON.parse(roh) : [])))
      } catch {
        setEntdeckt(new Set())
      }
    }
    lies()
    window.addEventListener("baerngo-album-neu", lies)
    return () => window.removeEventListener("baerngo-album-neu", lies)
  }, [])
  const albumAlle = albumGegenstaende()
  useEffect(() => {
    try {
      const roh = window.localStorage.getItem("baerngo-brunnen")
      setBrunnenGesammelt(
        parseBrunnenStand(roh ? JSON.parse(roh) : null).gesammelt,
      )
    } catch {
      setBrunnenGesammelt([])
    }
  }, [])

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
      {cursor && istEssen(cursor.id) ? (
        <button
          type="button"
          className="mc-btn mc-essen-btn"
          onClick={() => {
            if (!cursor) return
            esseGegenstand(cursor.id)
            spieleHaptik("sammeln")
            const rest = cursor.anzahl - 1
            setCursor(rest > 0 ? { id: cursor.id, anzahl: rest } : null)
            setEssenHinweis(
              `${gegenstandById(cursor.id)?.name ?? cursor.id} gegessen — ${
                essenArt(cursor.id)?.wirkung ?? ""
              }`,
            )
          }}
        >
          🍽 {gegenstandById(cursor.id)?.name} essen
        </button>
      ) : null}
      {essenHinweis ? <p className="mc-tagline">{essenHinweis}</p> : null}
      {name && cursor ? (
        <p className="mc-held-name">
          {name}
          {cursor.anzahl > 1 ? ` ×${cursor.anzahl}` : ""}
        </p>
      ) : null}
      <p className="mc-abzeichen-titel">
        Sammelalbum · {entdeckt.size}/{albumAlle.length} entdeckt
      </p>
      <ol className="mc-album" aria-label="Sammelalbum">
        {albumAlle.map((gegenstand) => {
          const da = entdeckt.has(gegenstand.id)
          return (
            <li
              key={gegenstand.id}
              className={da ? "mc-album-karte" : "mc-album-karte mc-album-fehlt"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gegenstand.textur}
                alt={da ? gegenstand.name : "Unentdeckt"}
              />
              <span>{da ? gegenstand.name : "???"}</span>
            </li>
          )
        })}
      </ol>
      <p className="mc-abzeichen-titel">
        Brunnen-Abzeichen · {brunnenGesammelt.length}/{BRUNNEN.length}
      </p>
      <ol className="mc-abzeichen" aria-label="Brunnen-Abzeichen">
        {BRUNNEN.map((brunnen) => {
          const da = brunnenGesammelt.includes(brunnen.id)
          return (
            <li
              key={brunnen.id}
              className={da ? undefined : "mc-abzeichen-fehlt"}
              title={da ? brunnen.name : `${brunnen.name} — noch nicht besucht`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bloecke/brunnen.png" alt={brunnen.name} />
            </li>
          )
        })}
      </ol>
    </section>
  )
}
