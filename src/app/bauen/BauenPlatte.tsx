"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  abbauDrop,
  anzeigeHaltbarkeit,
  istPickel,
  istSchaufel,
  nutzePickel,
  type AbbauStand,
} from "@/lib/abbauen"
import { aktionFuerHand, kannBlockSetzen } from "@/lib/bauen"
import { ernteDrops, istPflanze, kannPflanzen } from "@/lib/wachstum"
import { gegenstandById, istSetzbar } from "@/lib/gegenstaende"
import { spieleHaptik } from "@/lib/haptik"
import {
  HOTBAR_LAENGE,
  legeBeuteInSlots,
  legeBeuteInSlotsMitRest,
  nimmAnzahl,
  nimmVonIndex,
  zaehleSlots,
} from "@/lib/inventar"
import { berechneStrom, istSchaltbar } from "@/lib/redstone"
import { useBauen } from "../useBauen"
import { stasheBeute, useInventar } from "../useInventar"
import { usePickel } from "../usePickel"
import { kannQuickLook, oeffneInQuickLook } from "./quickLook"
import { starteBauenAr } from "./starteBauenAr"
import { startePlattenSzene, type PlattenSteuerung } from "./startePlattenSzene"

export function BauenPlatte() {
  const platte = useRef<HTMLCanvasElement>(null)
  const arCanvas = useRef<HTMLCanvasElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const sitzung = useRef<{ beenden: () => void } | null>(null)
  const { slots, inventar, setzeSlots } = useInventar()
  const { bloecke, setze, nimmWeg, ersetze, setzeAn } = useBauen()
  // Redstone-Signal aus dem aktuellen Bauwerk
  const strom = useMemo(() => berechneStrom(bloecke), [bloecke])
  const stromRef = useRef(strom)
  stromRef.current = strom
  const knopfTimer = useRef<Map<string, number>>(new Map())
  useEffect(() => {
    const timer = knopfTimer.current
    return () => {
      for (const id of timer.values()) window.clearTimeout(id)
    }
  }, [])

  function schalte(blockId: string): boolean {
    const block = bloecke.find((eintrag) => eintrag.id === blockId)
    if (!block || !istSchaltbar(block.gegenstandId)) return false
    if (block.gegenstandId === "knopf") {
      // Knopf: kurzer Puls wie in Minecraft
      setzeAn(blockId, true)
      spieleHaptik("wahl")
      window.clearTimeout(knopfTimer.current.get(blockId))
      knopfTimer.current.set(
        blockId,
        window.setTimeout(() => setzeAn(blockId, false), 1500),
      )
      return true
    }
    setzeAn(blockId, !block.an)
    spieleHaptik("wahl")
    return true
  }
  const { haltbarkeitFuer, setzeHaltbarkeitFuer, maximumFuer } = usePickel()
  const [wahlIndex, setWahlIndex] = useState<number | null>(null)
  const [arStatus, setArStatus] = useState<"aus" | "an" | "bereit">("aus")
  // iPhone: kein WebXR, aber Apples nativer AR-Viewer (Quick Look)
  const [quickLook, setQuickLook] = useState(false)
  const [quickLookLaeuft, setQuickLookLaeuft] = useState(false)
  useEffect(() => {
    setQuickLook(kannQuickLook())
  }, [])
  const [lebensgross, setLebensgross] = useState(false)

  useEffect(() => {
    setLebensgross(
      window.localStorage.getItem("baerngo-ar-lebensgross") === "1",
    )
  }, [])

  function schalteLebensgross() {
    setLebensgross((bisher) => {
      const danach = !bisher
      window.localStorage.setItem(
        "baerngo-ar-lebensgross",
        danach ? "1" : "0",
      )
      return danach
    })
  }
  const [hinweis, setHinweis] = useState("")
  const [abbau, setAbbau] = useState<AbbauStand>({})
  const abbauRef = useRef(abbau)
  abbauRef.current = abbau
  const hotbar = [...slots.slice(0, HOTBAR_LAENGE)]
  while (hotbar.length < HOTBAR_LAENGE) hotbar.push(null)
  const wahl = wahlIndex != null ? slots[wahlIndex]?.id ?? null : null
  const aktion = aktionFuerHand(wahl)
  const wahlName = wahl ? gegenstandById(wahl)?.name : null
  // Haltbarkeit für den gewählten Pickel, sonst für den besten im Inventar
  const pickelId =
    wahl && istPickel(wahl)
      ? wahl
      : ["diamantpickel", "eisenpickel", "pickel", "holzpickel"].find(
          (id) => (inventar[id] ?? 0) > 0,
        ) ?? null
  const pickelAnzeige =
    pickelId && (inventar[pickelId] ?? 0) > 0
      ? {
          name: gegenstandById(pickelId)?.name ?? "Pickel",
          wert: anzeigeHaltbarkeit(
            haltbarkeitFuer(pickelId),
            inventar[pickelId] ?? 0,
            maximumFuer(pickelId),
          ),
          max: maximumFuer(pickelId),
        }
      : null
  const modusText =
    aktion === "setzen" && wahlName
      ? `Setzen · ${wahlName} · halten baut ab`
      : aktion === "abbauen" && wahl && istPickel(wahl)
        ? `Abbauen · ${wahlName ?? "Spitzhacke"}`
        : aktion === "abbauen" && wahl && istSchaufel(wahl)
          ? `Graben · ${wahlName ?? "Schaufel"}`
          : aktion === "abbauen" && wahl === "schere"
          ? "Schneiden · Schere"
          : aktion === "abbauen" && wahl === "hacke"
            ? "Pflügen · Hacke"
            : aktion === "abbauen" && wahl === "axt"
          ? "Abbauen · Axt"
          : aktion === "abbauen"
            ? "Abbauen · Hand"
            : "Wähle Block oder Werkzeug"
  const steuerung = useRef<PlattenSteuerung>({
    wahl: () => wahl,
    kannSetzen: () =>
      Boolean(
        wahlIndex != null &&
          wahl &&
          istSetzbar(wahl) &&
          (slots[wahlIndex]?.anzahl ?? 0) > 0,
      ),
    werkzeug: () =>
      wahl &&
      (istPickel(wahl) ||
        istSchaufel(wahl) ||
        wahl === "axt" ||
        wahl === "hacke" ||
        wahl === "schere")
        ? wahl
        : null,
    bloecke: () => bloecke,
    abbau: () => ({}),
    aufSetzen: () => {},
    aufSchlag: () => false,
  })

  useEffect(() => {
    steuerung.current.wahl = () => wahl
    steuerung.current.kannSetzen = () =>
      Boolean(
        wahlIndex != null &&
          wahl &&
          istSetzbar(wahl) &&
          (slots[wahlIndex]?.anzahl ?? 0) > 0,
      )
    steuerung.current.werkzeug = () =>
      wahl &&
      (istPickel(wahl) ||
        istSchaufel(wahl) ||
        wahl === "axt" ||
        wahl === "hacke" ||
        wahl === "schere")
        ? wahl
        : null
    steuerung.current.bloecke = () => bloecke
    steuerung.current.abbau = () => abbauRef.current
    steuerung.current.aufSetzen = (zelle) => {
      if (wahlIndex == null || !wahl || !istSetzbar(wahl)) return
      if (!kannBlockSetzen(bloecke, zelle, wahl)) return
      if (!kannPflanzen(bloecke, wahl, zelle)) {
        setHinweis("Setzling und Samen brauchen Erde oder Gras darunter.")
        return
      }
      const genommen = nimmVonIndex(slots, wahlIndex, 1)
      if (!genommen.ok) return
      if (wahl === "wassereimer") {
        // Der Eimer giesst Wasser aus und ist danach wieder leer
        setze("wasser", zelle)
        setzeSlots(
          legeBeuteInSlots(genommen.slots, [
            { gegenstandId: "eimer", anzahl: 1 },
          ]),
        )
        setWahlIndex(null)
        spieleHaptik("setzen")
        setHinweis("Wasser platziert — der Eimer ist wieder leer.")
        return
      }
      setze(wahl, zelle)
      setzeSlots(genommen.slots)
      if (!genommen.slots[wahlIndex]) setWahlIndex(null)
      spieleHaptik("setzen")
      setHinweis("Gesetzt. Tippe eine Fläche für den nächsten Block.")
    }
    steuerung.current.aufSchlag = (blockId) =>
      schlageGesetzt(blockId, steuerung.current.werkzeug())
    steuerung.current.stromAn = () => stromRef.current
    steuerung.current.aufSchalte = (blockId) => schalte(blockId)
  })

  // Sagt hörbar und sichtbar, was beim Abbauen herauskam — gerade bei
  // Laub, das ohne Schere oft gar nichts hinterlässt.
  function meldeAbbau(
    gegenstandId: string,
    drops: { gegenstandId: string; anzahl: number }[],
  ) {
    if (drops.length === 0) {
      spieleHaptik("rattle")
      setHinweis(
        gegenstandId === "laub"
          ? "Laub zerfällt — nichts übrig. Mit der Schere gäbe es den Block."
          : "Abgebaut.",
      )
      return
    }
    const setzlingDabei = drops.some(
      (stuck) => stuck.gegenstandId === "setzling",
    )
    spieleHaptik(setzlingDabei ? "sammeln" : "abbauen")
    setHinweis(
      drops
        .map(
          (stuck) =>
            `+${stuck.anzahl} ${gegenstandById(stuck.gegenstandId)?.name ?? stuck.gegenstandId}`,
        )
        .join(" · ") + (setzlingDabei ? " !" : ""),
    )
  }

  function schlageGesetzt(blockId: string, werkzeug: string | null): boolean {
    const weg = bloecke.find((block) => block.id === blockId)
    if (!weg) return false
    if (
      werkzeug === "hacke" &&
      (weg.gegenstandId === "erde" || weg.gegenstandId === "gras")
    ) {
      // Pflügen wie in Minecraft: die Hacke macht Ackerboden daraus
      ersetze(blockId, "ackerboden")
      spieleHaptik("setzen")
      setHinweis("Gepflügt! Auf Ackerboden wächst Weizen doppelt so schnell.")
      return true
    }
    nimmWeg(blockId)
    const drops = ernteDrops(weg.gegenstandId, abbauDrop, Math.random, werkzeug)
    // Pflanzen direkt darüber verlieren ihren Boden und poppen mit ab
    const pflanzeOben = bloecke.find(
      (block) =>
        istPflanze(block.gegenstandId) &&
        block.zelle.ix === weg.zelle.ix &&
        block.zelle.iz === weg.zelle.iz &&
        block.zelle.iy === weg.zelle.iy + 1,
    )
    if (pflanzeOben) {
      nimmWeg(pflanzeOben.id)
      drops.push(
        ...ernteDrops(pflanzeOben.gegenstandId, abbauDrop, Math.random, werkzeug),
      )
    }
    const gelegt = legeBeuteInSlotsMitRest(slots, drops)
    if (gelegt.rest.length > 0) stasheBeute(gelegt.rest)
    let nextSlots = gelegt.slots
    if (
      werkzeug &&
      (istPickel(werkzeug) || istSchaufel(werkzeug) || werkzeug === "schere")
    ) {
      const max = maximumFuer(werkzeug)
      const bisher = haltbarkeitFuer(werkzeug)
      const bar = bisher > 0 ? bisher : max
      const nutzung = nutzePickel(zaehleSlots(nextSlots), bar, werkzeug)
      setzeHaltbarkeitFuer(werkzeug, nutzung.haltbarkeit)
      if (nutzung.zerbrochen) {
        nextSlots = nimmAnzahl(nextSlots, werkzeug, 1) ?? nextSlots
        spieleHaptik("zerbrochen")
        setHinweis(
          werkzeug === "schere"
            ? "Die Schere ist zerbrochen."
            : istSchaufel(werkzeug)
              ? "Die Schaufel ist zerbrochen."
              : "Die Spitzhacke ist zerbrochen.",
        )
      } else {
        meldeAbbau(weg.gegenstandId, drops)
      }
    } else {
      meldeAbbau(weg.gegenstandId, drops)
    }
    setzeSlots(nextSlots)
    return true
  }

  useEffect(() => {
    if (arStatus === "an") return
    const leinwand = platte.current
    if (!leinwand) return
    let stop: (() => void) | undefined
    let disposed = false
    void startePlattenSzene(leinwand, steuerung.current).then((ende) => {
      if (disposed) ende()
      else stop = ende
    })
    return () => {
      disposed = true
      stop?.()
    }
  }, [arStatus])

  useEffect(() => {
    const xr = navigator.xr
    if (!xr) return
    void xr.isSessionSupported("immersive-ar").then((ok) => {
      if (ok) setArStatus((bisher) => (bisher === "an" ? "an" : "bereit"))
    })
  }, [])

  async function starteAr() {
    if (!arCanvas.current || !overlay.current) return
    try {
      sitzung.current?.beenden()
      sitzung.current = await starteBauenAr(
        arCanvas.current,
        steuerung.current,
        overlay.current,
        {
          aufPlatte: () =>
            setHinweis(
              lebensgross
                ? "Lauf einfach hinein — die Blöcke stehen in echter Grösse um dich."
                : "Tippe dorthin, wo der Block hin soll — nicht in die Bildmitte.",
            ),
          aufEnde: () => {
            sitzung.current = null
            setArStatus("bereit")
            setHinweis("AR beendet. Weiter auf der Tischplatte.")
          },
          aufFlaeche: () =>
            setHinweis("Boden erkannt — tippe, die Platte kommt zum grünen Ring."),
          aufFehler: (text) => setHinweis(`AR-Fehler: ${text.slice(0, 90)}`),
        },
        { lebensgross },
      )
      setArStatus("an")
      spieleHaptik("ar")
      setHinweis(
        "Handy langsam über den Boden schwenken, bis der grüne Ring kommt, dann tippen. Ohne Ring legt ein Tipp die Platte vor dich.",
      )
    } catch {
      setArStatus("bereit")
      setHinweis("AR nicht verfügbar — bau hier auf der Platte weiter.")
    }
  }

  function beendeAr() {
    sitzung.current?.beenden()
  }

  useEffect(() => {
    return () => {
      sitzung.current?.beenden()
    }
  }, [])

  return (
    <section className={arStatus === "an" ? "mc-ar mc-ar-live" : "mc-ar"}>
      {arStatus !== "an" ? (
        <canvas ref={platte} className="mc-platte-canvas" />
      ) : null}
      <canvas
        ref={arCanvas}
        className={
          arStatus === "an" ? "mc-ar-canvas mc-ar-canvas-aktiv" : "mc-ar-canvas"
        }
      />
      <div ref={overlay} className="mc-ar-overlay">
        <div className="mc-ar-hud">
        <h1 className="mc-title">Bauen</h1>
        <p
          className={
            aktion === "setzen"
              ? "mc-bau-modus mc-bau-modus-setzen"
              : aktion === "abbauen"
                ? "mc-bau-modus mc-bau-modus-abbauen"
                : "mc-bau-modus"
          }
        >
          {modusText}
        </p>
        {hinweis ? <p className="mc-tagline">{hinweis}</p> : null}
        {pickelAnzeige ? (
          <p className="mc-pickel-bar" aria-label="Spitzhacke Haltbarkeit">
            {pickelAnzeige.name} {pickelAnzeige.wert}/{pickelAnzeige.max}
            <span
              className="mc-pickel-fill"
              style={{
                width: `${(pickelAnzeige.wert / pickelAnzeige.max) * 100}%`,
              }}
            />
          </p>
        ) : null}
        <ol className="mc-hotbar-raster" aria-label="Hotbar">
          {hotbar.map((slot, index) => {
            const item = slot ? gegenstandById(slot.id) : null
            return (
              <li key={`hotbar-${index}`}>
                <button
                  type="button"
                  className={
                    wahlIndex === index && slot
                      ? aktion === "abbauen"
                        ? "mc-slot mc-slot-wahl-abbau"
                        : "mc-slot mc-slot-wahl"
                      : "mc-slot"
                  }
                  onClick={() => {
                    if (!slot) return
                    const danach = wahlIndex === index ? null : index
                    setWahlIndex(danach)
                    const naechste =
                      danach == null ? "keine" : aktionFuerHand(slot.id)
                    setHinweis(
                      naechste === "setzen"
                        ? `Tippe eine Fläche, um ${gegenstandById(slot.id)?.name ?? slot.id} zu setzen. Halten bricht.`
                        : naechste === "abbauen"
                          ? "Halte auf einem Block. Pickel ist schneller."
                          : "Block setzen, halten zum Abbauen. Ziehe zum Drehen.",
                    )
                  }}
                  aria-label={item?.name ?? "Leer"}
                >
                  {item ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.textur}
                      alt={item.name}
                      className="mc-slot-block"
                    />
                  ) : null}
                  {slot && slot.anzahl > 1 ? (
                    <span className="mc-slot-count">{slot.anzahl}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ol>
        {quickLook ? (
          <button
            type="button"
            className="mc-btn mc-platte-ar"
            disabled={quickLookLaeuft}
            onClick={() => {
              setQuickLookLaeuft(true)
              oeffneInQuickLook(
                bloecke,
                strom,
                lebensgross ? 1 : 0.16,
              )
                .catch(() =>
                  setHinweis("AR-Ansicht hat nicht geklappt — nochmal tippen."),
                )
                .finally(() => setQuickLookLaeuft(false))
            }}
          >
            {quickLookLaeuft ? "…" : "📱 Bauwerk in AR ansehen"}
          </button>
        ) : null}
        {arStatus === "bereit" ? (
          <div className="mc-ar-startzeile">
            <button
              type="button"
              className="mc-btn mc-platte-ar"
              onClick={() => void starteAr()}
            >
              {lebensgross ? "Welt in Lebensgrösse" : "Platte auf den Boden"}
            </button>
            <button
              type="button"
              className={
                lebensgross ? "mc-btn mc-btn-toggle mc-btn-an" : "mc-btn mc-btn-toggle"
              }
              aria-pressed={lebensgross}
              onClick={schalteLebensgross}
            >
              {lebensgross ? "✓ Lebensgross · 1 m" : "Lebensgross · 1 m"}
            </button>
          </div>
        ) : null}
        {arStatus === "an" ? (
          <button
            type="button"
            className="mc-btn mc-platte-ar"
            onClick={beendeAr}
          >
            AR beenden
          </button>
        ) : null}
        </div>
      </div>
    </section>
  )
}
