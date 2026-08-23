"use client"

import { meldeTagesEreignis } from "../tagesEreignis"
import { useCallback, useEffect, useRef, useState } from "react"
import { haltbarkeitNachZugang, istPickel } from "@/lib/abbauen"
import { spieleHaptik } from "@/lib/haptik"
import { gegenstandById } from "@/lib/gegenstaende"
import {
  legeBeuteInSlotsMitRest,
  nimmAnzahl,
  zaehleSlots,
  type Cursor,
  type InventarSlot,
} from "@/lib/inventar"
import {
  fachBeiIndex,
  klickOfen,
  leererOfen,
  ofenInBeute,
  SCHMELZ_DAUER_MS,
  tickOfen,
  type OfenStand,
} from "@/lib/ofen"
import {
  formFuerRezept,
  ergebnisFuerRaster,
  fehlendeZutaten,
  kannRezept,
  klickRaster,
  leeresRaster,
  legeRezept,
  listRezepte,
  nimmCraft,
  rezeptById,
  rezeptFuerRaster,
  type Raster,
} from "@/lib/werkbank"
import { InventarRaster } from "../InventarRaster"
import { sichereBeuteSofort, useInventar } from "../useInventar"
import { usePickel } from "../usePickel"

export function WerkbankForm() {
  const { slots, setzeSlots } = useInventar()
  const { haltbarkeitFuer, setzeHaltbarkeitFuer, maximumFuer } = usePickel()
  const [raster, setRaster] = useState<Raster>(leeresRaster)
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const [rezeptId, setRezeptId] = useState("pickel")
  const cursorRef = useRef(cursor)
  cursorRef.current = cursor
  const rasterRef = useRef(raster)
  rasterRef.current = raster
  const [ofen, setOfen] = useState<OfenStand>(leererOfen)
  const ofenRef = useRef(ofen)
  ofenRef.current = ofen
  const skipRasterKlick = useRef(0)

  useEffect(() => {
    // Raster-, Ofen- und Hand-Inhalt sichern — beim Verlassen der Seite
    // UND wenn das System die App killt (pagehide). Danach Zustände
    // leeren, damit ein bfcache-Comeback nichts doppelt auszahlt.
    function sichere() {
      const beute: { gegenstandId: string; anzahl: number }[] = []
      const held = cursorRef.current
      if (held) beute.push({ gegenstandId: held.id, anzahl: held.anzahl })
      for (const zelle of rasterRef.current) {
        if (zelle) beute.push({ gegenstandId: zelle.id, anzahl: zelle.anzahl })
      }
      beute.push(...ofenInBeute(ofenRef.current))
      if (beute.length === 0) return
      cursorRef.current = null
      rasterRef.current = leeresRaster()
      ofenRef.current = leererOfen()
      sichereBeuteSofort(beute)
      setCursor(null)
      setRaster(leeresRaster())
      setOfen(leererOfen())
    }
    window.addEventListener("pagehide", sichere)
    return () => {
      window.removeEventListener("pagehide", sichere)
      sichere()
    }
  }, [])

  const ergebnis = ergebnisFuerRaster(raster)
  const craftRezept = rezeptFuerRaster(raster)
  const rezept = rezeptById(rezeptId)
  const vorschau = rezept
    ? formFuerRezept(rezept)
    : ([null, null, null, null, null, null, null, null, null] as (
        | string
        | null
      )[])
  // Der Ofen läuft in Echtzeit weiter — auch während man zuschaut.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setOfen((bisher) => {
        const danach = tickOfen(bisher, 250)
        ofenRef.current = danach
        return danach
      })
    }, 250)
    return () => window.clearInterval(timer)
  }, [])

  const vorrat = vorratJetzt(slots, raster, cursor, ofen)
  const feuerAnteil =
    ofen.brandGesamtMs && ofen.brandRestMs
      ? Math.max(0, Math.min(1, ofen.brandRestMs / ofen.brandGesamtMs))
      : 0
  const schmelzAnteil = Math.max(
    0,
    Math.min(1, (ofen.schmelzMs ?? 0) / SCHMELZ_DAUER_MS),
  )
  const geht = kannRezept(vorrat, leeresRaster(), rezeptId)
  const fehltListe = rezept
    ? fehlendeZutaten(vorrat, leeresRaster(), rezept.id)
    : []

  const legeAufRaster = useCallback((
    index: number,
    held: Cursor | null,
    taste: "links" | "rechts" = "links",
  ) => {
    // Zeitstempel statt setTimeout(0): synthetische Klicks können auf
    // Touch-Geräten deutlich später eintreffen und würden den Griff
    // sonst doppelt ausführen.
    skipRasterKlick.current = performance.now()
    if (index >= 20) {
      const fach = fachBeiIndex(index - 20)
      if (!fach) return held
      const r = klickOfen(ofenRef.current, fach, held, taste)
      ofenRef.current = r.stand
      cursorRef.current = r.cursor
      setOfen(r.stand)
      return r.cursor
    }
    const r = klickRaster(rasterRef.current, index, held, taste)
    rasterRef.current = r.raster
    cursorRef.current = r.cursor
    setRaster(r.raster)
    return r.cursor
  }, [])

  // Touch-Bedienung: kurzer Tipp legt EIN Stück ab, langes Drücken den
  // ganzen Stapel. Die Entscheidung trifft das Zieh-System im
  // InventarRaster und reicht sie als "taste" herein.
  function tippeRaster(index: number) {
    // Klicks kurz nach einem Pointer-Griff sind Duplikate; echte
    // Tastatur-Klicks (Enter auf dem Knopf) kommen ohne Pointer davor.
    if (performance.now() - skipRasterKlick.current < 600) return
    const taste = cursorRef.current ? "rechts" : "links"
    const rest = legeAufRaster(index, cursorRef.current, taste)
    setCursor(rest)
  }


  function fuelleRezept(id: string) {
    const zurueck: { gegenstandId: string; anzahl: number }[] = []
    if (cursor) zurueck.push({ gegenstandId: cursor.id, anzahl: cursor.anzahl })
    for (const zelle of raster) {
      if (zelle) zurueck.push({ gegenstandId: zelle.id, anzahl: zelle.anzahl })
    }
    const einsortiert = legeBeuteInSlotsMitRest(slots, zurueck)
    if (einsortiert.rest.length > 0) {
      spieleHaptik("falsch")
      return
    }
    let next = einsortiert.slots
    const gelegt = legeRezept(zaehleSlots(next), leeresRaster(), id)
    if (!gelegt.ok) {
      spieleHaptik("falsch")
      return
    }
    const rezept = rezeptById(id)
    if (!rezept) return
    for (const [zutatId, anzahl] of Object.entries(rezept.zutat)) {
      const genommen = nimmAnzahl(next, zutatId, anzahl)
      if (!genommen) {
        spieleHaptik("falsch")
        return
      }
      next = genommen
    }
    spieleHaptik("setzen")
    setzeSlots(next)
    setRaster(gelegt.raster)
    setCursor(null)
    setRezeptId(id)
  }

  function nimmErgebnis() {
    // Touch-Modus wie Minecraft Bedrock: das Ergebnis wandert direkt
    // in den Beutel, jede belegte Zelle verliert genau ein Stück —
    // mit gestapelten Zellen kann man mehrmals hintereinander craften.
    const gecraftet = nimmCraft(rasterRef.current)
    if (!gecraftet.ok) {
      spieleHaptik("falsch")
      return
    }
    const gelegt = legeBeuteInSlotsMitRest(slots, [
      { gegenstandId: gecraftet.ergebnis.id, anzahl: gecraftet.anzahl },
    ])
    if (gelegt.rest.length > 0) {
      // Kein Platz: Zutaten bleiben im Raster liegen.
      spieleHaptik("falsch")
      return
    }
    spieleHaptik("craft")
    meldeTagesEreignis("craft", gecraftet.anzahl, gecraftet.ergebnis.id)
    if (istPickel(gecraftet.ergebnis.id)) {
      const id = gecraftet.ergebnis.id
      // Auch Hand und Ofen zählen — sonst "repariert" das Craften
      // einer zweiten Spitzhacke die abgenutzte gratis.
      const beiHand = cursorRef.current?.id === id ? cursorRef.current.anzahl : 0
      const imOfen = ofenInBeute(ofenRef.current)
        .filter((stuck) => stuck.gegenstandId === id)
        .reduce((summe, stuck) => summe + stuck.anzahl, 0)
      const vorher = (zaehleSlots(slots)[id] ?? 0) + beiHand + imOfen
      setzeHaltbarkeitFuer(
        id,
        haltbarkeitNachZugang(
          haltbarkeitFuer(id),
          vorher,
          vorher + gecraftet.anzahl,
          maximumFuer(id),
        ),
      )
    }
    setzeSlots(gelegt.slots)
    rasterRef.current = gecraftet.raster
    setRaster(gecraftet.raster)
  }

  return (
    <section className="mc-panel">
      <h1 className="mc-title">Werkbank</h1>

      <div className="mc-werkbank-fenster">
        <div className="mc-table">
          <div className="mc-grid3">
            {raster.map((zelle, index) => {
              const item = zelle ? gegenstandById(zelle.id) : null
              return (
                <button
                  key={index}
                  type="button"
                  className="mc-slot mc-craft-slot"
                  data-craft-slot={index}
                  onPointerDown={(event) => {
                    if (event.button === 2) return
                    event.preventDefault()
                    event.currentTarget.setPointerCapture(event.pointerId)
                  }}
                  onClick={() => tippeRaster(index)}
                >
                  {item ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.textur}
                      alt={item.name}
                      draggable={false}
                      className="mc-slot-block"
                    />
                  ) : null}
                  {zelle && zelle.anzahl > 1 ? (
                    <span className="mc-slot-count">{zelle.anzahl}</span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <span className="mc-arrow">→</span>
          <button
            type="button"
            className="mc-slot mc-out-slot"
            disabled={!ergebnis}
            onClick={nimmErgebnis}
            aria-label="Ergebnis nehmen"
          >
            {ergebnis ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ergebnis.textur}
                alt={ergebnis.name}
                className="mc-slot-block"
              />
            ) : null}
            {craftRezept && craftRezept.ergebnisAnzahl > 1 ? (
              <span className="mc-slot-count">{craftRezept.ergebnisAnzahl}</span>
            ) : null}
          </button>
        </div>
        <p className="mc-kicker">Ofen</p>
        {(vorrat.ofen ?? 0) > 0 ? (
          <div className="mc-table mc-ofen-ui">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bloecke/ofen.png" alt="" className="mc-ofen-icon" />
            <div className="mc-ofen-feuer">
              {ofenFachKnopf(
                "eingabe",
                20,
                ofen.eingabe,
                "Erz / Stamm",
                tippeRaster,
              )}
              <span
                className="mc-ofen-flamme"
                aria-label={
                  feuerAnteil > 0 ? "Ofen brennt" : "Ofen ist aus"
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bloecke/flamme-aus.png" alt="" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/bloecke/flamme.png"
                  alt=""
                  className="mc-ofen-flamme-an"
                  style={{
                    clipPath: `inset(${(1 - feuerAnteil) * 100}% 0 0 0)`,
                  }}
                />
              </span>
              {ofenFachKnopf(
                "brennstoff",
                21,
                ofen.brennstoff,
                "Holz / Kohle",
                tippeRaster,
              )}
            </div>
            <span className="mc-ofen-pfeil" aria-label="Schmelz-Fortschritt">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bloecke/pfeil-aus.png" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bloecke/pfeil.png"
                alt=""
                className="mc-ofen-pfeil-voll"
                style={{ clipPath: `inset(0 ${(1 - schmelzAnteil) * 100}% 0 0)` }}
              />
            </span>
            {ofenFachKnopf(
              "ausgabe",
              22,
              ofen.ausgabe,
              "Raus",
              tippeRaster,
              true,
            )}
          </div>
        ) : (
          <p className="mc-tagline">
            Baue zuerst einen Ofen — 8 Stein im Ring.
          </p>
        )}
        <InventarRaster
          slots={slots}
          onSlots={setzeSlots}
          cursor={cursor}
          onCursor={setCursor}
          onCraftDrop={legeAufRaster}
          klasse="mc-inv-in-werkbank"
        />
      </div>

      <h2 className="mc-kicker">Rezepte</h2>
      {rezept ? (
        <div className="mc-rezept-karte">
          <p className="mc-rezept-name">{rezept.name}</p>
          {rezept.gruppe ? (
            <div className="mc-varianten" aria-label="Varianten">
              {listRezepte()
                .filter((variante) => variante.gruppe === rezept.gruppe)
                .map((variante) => {
                  const vItem = gegenstandById(variante.ergebnisId)
                  return (
                    <button
                      key={variante.id}
                      type="button"
                      className={
                        variante.id === rezept.id
                          ? "mc-slot mc-variante mc-variante-wahl"
                          : "mc-slot mc-variante"
                      }
                      onClick={() => setRezeptId(variante.id)}
                      aria-label={variante.name}
                    >
                      {vItem ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={vItem.textur}
                          alt=""
                          className="mc-slot-block"
                        />
                      ) : null}
                    </button>
                  )
                })}
            </div>
          ) : null}
          <div className="mc-grid3 mc-grid3-mini" aria-hidden>
            {vorschau.map((zelle, index) => {
              const item = zelle ? gegenstandById(zelle) : null
              return (
                <span key={index} className="mc-slot mc-craft-slot">
                  {item ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.textur} alt="" className="mc-slot-block" />
                  ) : null}
                </span>
              )
            })}
          </div>
          <p className="mc-tagline">
            {fehltListe
              .map((zutat) => {
                const name = gegenstandById(zutat.id)?.name ?? zutat.id
                return `${name} ${zutat.haben}/${zutat.braucht}`
              })
              .join(" · ")}
          </p>
          <button
            type="button"
            className="mc-btn"
            disabled={!geht}
            onClick={() => fuelleRezept(rezept.id)}
          >
            Ins Feld legen
          </button>
        </div>
      ) : null}
      <ul className="mc-rezepte">
        {gruppierteRezepte(vorrat).map((eintrag) => {
          const item = gegenstandById(eintrag.ergebnisId)
          const bereit = kannRezept(vorrat, leeresRaster(), eintrag.id)
          return (
            <li key={eintrag.id}>
              <button
                type="button"
                className={
                  eintrag.id === rezeptId
                    ? "mc-slot mc-rezept mc-rezept-wahl"
                    : bereit
                      ? "mc-slot mc-rezept"
                      : "mc-slot mc-rezept mc-rezept-aus"
                }
                onClick={() =>
                  bereit ? fuelleRezept(eintrag.id) : setRezeptId(eintrag.id)
                }
                aria-label={eintrag.name}
              >
                {item ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.textur}
                    alt={eintrag.name}
                    className="mc-slot-block"
                  />
                ) : null}
              </button>
              <span className="mc-rezept-label">{eintrag.name}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Eine Zeile pro Rezeptgruppe: Gruppen (z. B. die vier Spitzhacken)
// zeigen die beste Variante, die man sich gerade leisten kann —
// die anderen Stufen wählt man über die Chips in der Rezeptkarte.
function gruppierteRezepte(vorrat: Record<string, number>) {
  const liste: ReturnType<typeof listRezepte>[number][] = []
  const gesehen = new Set<string>()
  for (const rezept of listRezepte()) {
    if (!rezept.gruppe) {
      liste.push(rezept)
      continue
    }
    if (gesehen.has(rezept.gruppe)) continue
    gesehen.add(rezept.gruppe)
    const varianten = listRezepte().filter(
      (kandidat) => kandidat.gruppe === rezept.gruppe,
    )
    const beste = [...varianten]
      .reverse()
      .find((kandidat) => kannRezept(vorrat, leeresRaster(), kandidat.id))
    liste.push(beste ?? rezept)
  }
  return liste
}

function ofenFachKnopf(
  fach: string,
  index: number,
  slot: InventarSlot,
  label: string,
  onTipp: (index: number) => void,
  ausgabe = false,
) {
  const item = slot ? gegenstandById(slot.id) : null
  return (
    <button
      type="button"
      className={ausgabe ? "mc-slot mc-out-slot" : "mc-slot mc-craft-slot"}
      data-craft-slot={index}
      aria-label={label}
      onPointerDown={(event) => {
        if (event.button === 2) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onClick={() => onTipp(index)}
    >
      {item && slot ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.textur}
          alt={item.name}
          draggable={false}
          className="mc-slot-block"
        />
      ) : null}
      {slot && slot.anzahl > 1 ? (
        <span className="mc-slot-count">{slot.anzahl}</span>
      ) : null}
    </button>
  )
}

function vorratJetzt(
  slots: Parameters<typeof zaehleSlots>[0],
  raster: Raster,
  cursor: Cursor | null,
  ofen: OfenStand,
) {
  const stand = zaehleSlots(slots)
  if (cursor) stand[cursor.id] = (stand[cursor.id] ?? 0) + cursor.anzahl
  for (const zelle of raster) {
    if (zelle) stand[zelle.id] = (stand[zelle.id] ?? 0) + zelle.anzahl
  }
  // Auch was im Ofen liegt, gehört dem Spieler
  for (const stuck of ofenInBeute(ofen)) {
    stand[stuck.gegenstandId] = (stand[stuck.gegenstandId] ?? 0) + stuck.anzahl
  }
  return stand
}
