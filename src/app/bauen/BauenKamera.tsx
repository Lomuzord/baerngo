"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  nutzePickel,
  schlageBlock,
  type AbbauStand,
} from "@/lib/abbauen"
import {
  glbFuerGegenstand,
  kannSceneViewer,
  modelViewerArModi,
  sceneViewerUrl,
} from "@/lib/ar"
import { hatAbbauWerkzeug } from "@/lib/bauen"
import { gegenstandById } from "@/lib/gegenstaende"
import { hotbarSlots } from "@/lib/hotbar"
import { useBauen } from "../useBauen"
import { useInventar } from "../useInventar"
import { usePickel } from "../usePickel"
import { useSpielerOrt } from "../useSpielerOrt"
import { starteBauenAr } from "./starteBauenAr"

export function BauenKamera() {
  const video = useRef<HTMLVideoElement>(null)
  const arCanvas = useRef<HTMLCanvasElement>(null)
  const sitzung = useRef<{ beenden: () => void } | null>(null)
  const { inventar, setzeInventar } = useInventar()
  const { bloecke, setze, nimmWeg } = useBauen()
  const spieler = useSpielerOrt()
  const { haltbarkeit, setzeHaltbarkeit, maximum } = usePickel()
  const [wahl, setWahl] = useState<string | null>(null)
  const [kamera, setKamera] = useState<"an" | "aus">("aus")
  const [ursprung, setUrsprung] = useState("")
  const [arStatus, setArStatus] = useState<"aus" | "an" | "fehlt">("aus")
  const [hinweis, setHinweis] = useState<string | null>(null)
  const [abbau, setAbbau] = useState<AbbauStand>({})
  const abbauRef = useRef(abbau)
  abbauRef.current = abbau
  const slots = hotbarSlots(inventar)
  const arGegenstand = wahl && wahl !== "pickel" ? wahl : "erde"
  const arGlb = useMemo(() => {
    if (!ursprung) return ""
    return new URL(glbFuerGegenstand(arGegenstand), ursprung).toString()
  }, [arGegenstand, ursprung])
  const sceneViewerBereit = kannSceneViewer(ursprung)
  const steuerung = useRef({
    wahl: () => wahl,
    kannSetzen: () => Boolean(wahl && wahl !== "pickel" && (inventar[wahl] ?? 0) > 0),
    werkzeug: () =>
      wahl === "pickel" && hatAbbauWerkzeug(inventar) ? "pickel" : null,
    bloecke: () => bloecke,
    aufSetzen: (_pose: { x: number; y: number; z: number }) => {},
    aufSchlag: (_id: string) => false,
  })

  useEffect(() => {
    setUrsprung(window.location.origin)
  }, [])

  useEffect(() => {
    steuerung.current.wahl = () => wahl
    steuerung.current.kannSetzen = () =>
      Boolean(wahl && wahl !== "pickel" && (inventar[wahl] ?? 0) > 0)
    steuerung.current.werkzeug = () =>
      wahl === "pickel" && hatAbbauWerkzeug(inventar) ? "pickel" : null
    steuerung.current.bloecke = () => bloecke
    steuerung.current.aufSetzen = (pose) => {
      if (!wahl || wahl === "pickel" || (inventar[wahl] ?? 0) < 1) return
      const lat = spieler.status === "bereit" ? spieler.lage.lat : 0
      const lng = spieler.status === "bereit" ? spieler.lage.lng : 0
      setze(wahl, lat, lng, pose)
      const danach = { ...inventar, [wahl]: inventar[wahl] - 1 }
      if (danach[wahl] <= 0) delete danach[wahl]
      setzeInventar(danach)
    }
    steuerung.current.aufSchlag = (blockId) =>
      schlageGesetzt(blockId, steuerung.current.werkzeug())
  })

  function schlageGesetzt(blockId: string, werkzeug: string | null): boolean {
    const weg = bloecke.find((block) => block.id === blockId)
    if (!weg) return false
    const schlag = schlageBlock(abbauRef.current, blockId, werkzeug)
    setAbbau(schlag.stand)
    if (!schlag.zerstoert) {
      setHinweis(
        werkzeug === "pickel"
          ? "Spitzhacke: fast weg."
          : `Hand: ${schlag.treffer}/${schlag.braucht}`,
      )
      return false
    }
    nimmWeg(blockId)
    let nextInv = {
      ...inventar,
      [weg.gegenstandId]: (inventar[weg.gegenstandId] ?? 0) + 1,
    }
    if (werkzeug === "pickel") {
      const bar = haltbarkeit > 0 ? haltbarkeit : maximum
      const nutzung = nutzePickel(nextInv, bar)
      nextInv = nutzung.inventar
      setzeHaltbarkeit(nutzung.haltbarkeit)
      if (nutzung.zerbrochen) setHinweis("Die Spitzhacke ist zerbrochen.")
    }
    setzeInventar(nextInv)
    return true
  }

  useEffect(() => {
    let stream: MediaStream | undefined
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        if (video.current) video.current.srcObject = stream
        setKamera("an")
      } catch {
        setKamera("aus")
      }
    })()
    return () => {
      stream?.getTracks().forEach((track) => track.stop())
      sitzung.current?.beenden()
    }
  }, [])

  function platziereGps() {
    if (!wahl || wahl === "pickel") return
    if ((inventar[wahl] ?? 0) < 1) return
    if (spieler.status !== "bereit") return
    setze(wahl, spieler.lage.lat, spieler.lage.lng)
    const danach = { ...inventar, [wahl]: inventar[wahl] - 1 }
    if (danach[wahl] <= 0) delete danach[wahl]
    setzeInventar(danach)
  }

  function oeffneSceneViewer() {
    if (!arGlb) return
    const titel = gegenstandById(arGegenstand)?.name ?? arGegenstand
    window.location.href = sceneViewerUrl(arGlb, titel)
  }

  async function starteAr() {
    if (!arCanvas.current) return
    try {
      sitzung.current?.beenden()
      sitzung.current = await starteBauenAr(arCanvas.current, steuerung.current)
      setArStatus("an")
      setHinweis(
        "Platte liegt auf der erkannten Ebene. Block setzen oder Spitzhacke wählen und abbauen.",
      )
    } catch {
      setArStatus("fehlt")
      setHinweis(
        "WebXR/ARCore nicht verfügbar. GPS-Setzen oder Scene Viewer (HTTPS, Android) nutzen.",
      )
    }
  }

  return (
    <section className="mc-ar">
      <video ref={video} className="mc-ar-video" autoPlay playsInline muted />
      <canvas
        ref={arCanvas}
        className={
          arStatus === "an" ? "mc-ar-canvas mc-ar-canvas-aktiv" : "mc-ar-canvas"
        }
      />
      {kamera === "aus" && arStatus !== "an" ? (
        <div className="mc-ar-fallback">Kamera aus — Blöcke stehen trotzdem am GPS.</div>
      ) : null}
      <div className="mc-ar-hud">
        <h1 className="mc-title">Bauen</h1>
        <p className="mc-tagline">
          Wie Minecraft Earth: Platte auf dem Boden, Raster, Hotbar.{" "}
          {spieler.status === "bereit" ? `${bloecke.length} gesetzt.` : ""}
        </p>
        {hinweis ? <p className="mc-tagline">{hinweis}</p> : null}
        {(inventar.pickel ?? 0) > 0 ? (
          <p className="mc-pickel-bar" aria-label="Spitzhacke Haltbarkeit">
            Pickel {haltbarkeit}/{maximum}
            <span
              className="mc-pickel-fill"
              style={{ width: `${(haltbarkeit / maximum) * 100}%` }}
            />
          </p>
        ) : null}
        <ol className="mc-hotbar" aria-label="Hotbar">
          {slots.map((slot, index) => {
            const item = slot.id ? gegenstandById(slot.id) : null
            return (
              <li key={slot.id ?? `leer-${index}`}>
                <button
                  type="button"
                  className={
                    wahl === slot.id && slot.id
                      ? "mc-slot mc-slot-wahl"
                      : "mc-slot"
                  }
                  onClick={() => setWahl(slot.id)}
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
                  {slot.anzahl > 0 ? (
                    <span className="mc-slot-count">{slot.anzahl}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ol>
        <div className="mc-ar-actions">
          <button
            type="button"
            className="mc-btn"
            disabled={!wahl || wahl === "pickel" || spieler.status !== "bereit"}
            onClick={platziereGps}
          >
            GPS setzen
          </button>
          <button type="button" className="mc-btn" onClick={() => void starteAr()}>
            AR-Platte
          </button>
          <button
            type="button"
            className="mc-btn"
            disabled={!sceneViewerBereit}
            onClick={oeffneSceneViewer}
          >
            Scene Viewer
          </button>
        </div>
        {bloecke.length > 0 ? (
          <ul className="mc-ar-bloecke">
            {bloecke.map((block) => (
              <li key={block.id}>
                <button
                  type="button"
                  className="mc-btn"
                  onClick={() =>
                    schlageGesetzt(
                      block.id,
                      hatAbbauWerkzeug(inventar) ? "pickel" : null,
                    )
                  }
                >
                  Abbau {gegenstandById(block.gegenstandId)?.name ?? block.gegenstandId}
                  {abbau[block.id]
                    ? ` ${abbau[block.id]}/${hatAbbauWerkzeug(inventar) ? 1 : 4}`
                    : ""}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {arGlb ? (
          <model-viewer
            src={arGlb}
            alt={gegenstandById(arGegenstand)?.name ?? "Block"}
            ar
            ar-modes={modelViewerArModi()}
            camera-controls
            className="mc-ar-model"
          />
        ) : null}
      </div>
    </section>
  )
}
