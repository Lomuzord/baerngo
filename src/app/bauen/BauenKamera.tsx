"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  glbFuerGegenstand,
  kannSceneViewer,
  modelViewerArModi,
  sceneViewerUrl,
} from "@/lib/ar"
import { gegenstandById } from "@/lib/gegenstaende"
import { useBauen } from "../useBauen"
import { useInventar } from "../useInventar"
import { useSpielerOrt } from "../useSpielerOrt"

export function BauenKamera() {
  const video = useRef<HTMLVideoElement>(null)
  const { inventar, setzeInventar } = useInventar()
  const { bloecke, setze } = useBauen()
  const spieler = useSpielerOrt()
  const [wahl, setWahl] = useState<string | null>(null)
  const [kamera, setKamera] = useState<"an" | "aus">("aus")
  const [ursprung, setUrsprung] = useState("")
  const vorrat = Object.entries(inventar).filter(([, n]) => n > 0)
  const arGegenstand = wahl ?? bloecke.at(-1)?.gegenstandId ?? "erde"
  const arGlb = useMemo(() => {
    if (!ursprung) return ""
    return new URL(glbFuerGegenstand(arGegenstand), ursprung).toString()
  }, [arGegenstand, ursprung])
  const arBereit = kannSceneViewer(ursprung)

  useEffect(() => {
    setUrsprung(window.location.origin)
  }, [])

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
    return () => stream?.getTracks().forEach((track) => track.stop())
  }, [])

  function platziere() {
    if (!wahl) return
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

  return (
    <section className="mc-ar">
      <video ref={video} className="mc-ar-video" autoPlay playsInline muted />
      {kamera === "aus" ? (
        <div className="mc-ar-fallback">Kamera aus — Blöcke stehen trotzdem am GPS.</div>
      ) : null}
      <div className="mc-ar-hud">
        <h1 className="mc-title">Bauen</h1>
        <p className="mc-tagline">
          Wähle einen Block und tippe in die Welt.{" "}
          {spieler.status === "bereit"
            ? `${bloecke.length} gesetzt.`
            : "Standort nötig."}{" "}
          ARCore Scene Viewer braucht HTTPS.
        </p>
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
        <button
          type="button"
          className="mc-btn"
          disabled={!wahl || spieler.status !== "bereit"}
          onClick={platziere}
        >
          Block setzen
        </button>
        {arBereit ? (
          <button
            type="button"
            className="mc-btn"
            onClick={oeffneSceneViewer}
          >
            In AR zeigen
          </button>
        ) : (
          <p className="mc-tagline">
            Scene Viewer erst über HTTPS. Kamera+GPS bleibt der Fallback.
          </p>
        )}
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
