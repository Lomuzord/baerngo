"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  glbFuerGegenstand,
  kannSceneViewer,
  modelViewerArModi,
  sceneViewerUrl,
} from "@/lib/ar"
import { hatAbbauWerkzeug } from "@/lib/bauen"
import { gegenstandById } from "@/lib/gegenstaende"
import { useBauen } from "../useBauen"
import { useInventar } from "../useInventar"
import { useSpielerOrt } from "../useSpielerOrt"
import { starteBauenAr } from "./starteBauenAr"

export function BauenKamera() {
  const video = useRef<HTMLVideoElement>(null)
  const arCanvas = useRef<HTMLCanvasElement>(null)
  const sitzung = useRef<{ beenden: () => void } | null>(null)
  const { inventar, setzeInventar } = useInventar()
  const { bloecke, setze, nimmWeg } = useBauen()
  const spieler = useSpielerOrt()
  const [wahl, setWahl] = useState<string | null>(null)
  const [kamera, setKamera] = useState<"an" | "aus">("aus")
  const [ursprung, setUrsprung] = useState("")
  const [arStatus, setArStatus] = useState<"aus" | "an" | "fehlt">("aus")
  const [hinweis, setHinweis] = useState<string | null>(null)
  const vorrat = Object.entries(inventar).filter(([, n]) => n > 0)
  const arGegenstand = wahl ?? bloecke.at(-1)?.gegenstandId ?? "erde"
  const arGlb = useMemo(() => {
    if (!ursprung) return ""
    return new URL(glbFuerGegenstand(arGegenstand), ursprung).toString()
  }, [arGegenstand, ursprung])
  const sceneViewerBereit = kannSceneViewer(ursprung)
  const pickelBereit = hatAbbauWerkzeug(inventar)
  const steuerung = useRef({
    wahl: () => wahl,
    kannSetzen: () => Boolean(wahl && (inventar[wahl] ?? 0) > 0),
    kannAbbauen: () => hatAbbauWerkzeug(inventar),
    bloecke: () => bloecke,
    aufSetzen: (_pose: { x: number; y: number; z: number }) => {},
    aufAbbauen: (_id: string) => {},
  })

  useEffect(() => {
    setUrsprung(window.location.origin)
  }, [])

  useEffect(() => {
    steuerung.current.wahl = () => wahl
    steuerung.current.kannSetzen = () =>
      Boolean(wahl && (inventar[wahl] ?? 0) > 0)
    steuerung.current.kannAbbauen = () => hatAbbauWerkzeug(inventar)
    steuerung.current.bloecke = () => bloecke
    steuerung.current.aufSetzen = (pose) => {
      if (!wahl || (inventar[wahl] ?? 0) < 1) return
      const lat = spieler.status === "bereit" ? spieler.lage.lat : 0
      const lng = spieler.status === "bereit" ? spieler.lage.lng : 0
      setze(wahl, lat, lng, pose)
      const danach = { ...inventar, [wahl]: inventar[wahl] - 1 }
      if (danach[wahl] <= 0) delete danach[wahl]
      setzeInventar(danach)
    }
    steuerung.current.aufAbbauen = (blockId) => {
      if (!hatAbbauWerkzeug(inventar)) return
      const weg = bloecke.find((block) => block.id === blockId)
      if (!weg) return
      nimmWeg(blockId)
      setzeInventar({
        ...inventar,
        [weg.gegenstandId]: (inventar[weg.gegenstandId] ?? 0) + 1,
      })
    }
  }, [wahl, inventar, bloecke, spieler, setze, nimmWeg, setzeInventar])

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
    if (!wahl) return
    if ((inventar[wahl] ?? 0) < 1) return
    if (spieler.status !== "bereit") return
    setze(wahl, spieler.lage.lat, spieler.lage.lng)
    const danach = { ...inventar, [wahl]: inventar[wahl] - 1 }
    if (danach[wahl] <= 0) delete danach[wahl]
    setzeInventar(danach)
  }

  function baueGpsAb(blockId: string) {
    if (!pickelBereit) {
      setHinweis("Zum Abbauen eine Spitzhacke craften.")
      return
    }
    const weg = bloecke.find((block) => block.id === blockId)
    if (!weg) return
    nimmWeg(blockId)
    setzeInventar({
      ...inventar,
      [weg.gegenstandId]: (inventar[weg.gegenstandId] ?? 0) + 1,
    })
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
      setHinweis("Tippe auf den Boden zum Setzen. Mit Spitzhacke auf einen Block tippen zum Abbauen.")
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
          Setzen: Block wählen, dann Boden antippen. Abbauen: Spitzhacke im Inventar, Block antippen.{" "}
          {spieler.status === "bereit"
            ? `${bloecke.length} gesetzt.`
            : "Standort hilft beim GPS-Fallback."}
        </p>
        {hinweis ? <p className="mc-tagline">{hinweis}</p> : null}
        <ul className="mc-hotbar">
          {vorrat.map(([id, anzahl]) => {
            const item = gegenstandById(id)
            return (
              <li key={id}>
                <button
                  type="button"
                  className={wahl === id ? "mc-slot mc-slot-wahl" : "mc-slot"}
                  onClick={() => setWahl(id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item?.textur ?? "/bloecke/erde.png"}
                    alt={item?.name ?? id}
                    className="mc-slot-block"
                  />
                  <span className="mc-slot-count">{anzahl}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mc-ar-actions">
          <button
            type="button"
            className="mc-btn"
            disabled={!wahl || spieler.status !== "bereit"}
            onClick={platziereGps}
          >
            GPS setzen
          </button>
          <button type="button" className="mc-btn" onClick={() => void starteAr()}>
            ARCore / WebXR
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
                  onClick={() => baueGpsAb(block.id)}
                >
                  Abbau {gegenstandById(block.gegenstandId)?.name ?? block.gegenstandId}
                  {block.ar ? " (AR)" : " (GPS)"}
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
