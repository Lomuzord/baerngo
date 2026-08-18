"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { BERN_KARTE, kameraFuerSpieler, SPIELER_KAMERA } from "@/lib/karte"
import { applyMinecraftLook, MINECRAFT_GEBAEUDE } from "@/lib/minecraftStyle"
import { gegenstandById } from "@/lib/gegenstaende"
import { listSichtModelle, type SichtModell } from "@/lib/platzierung"
import { useBauen } from "./useBauen"
import { useSpielerOrt } from "./useSpielerOrt"

export function BernKarteGl() {
  const kasten = useRef<HTMLDivElement>(null)
  const karte = useRef<mapboxgl.Map | null>(null)
  const spielerMarker = useRef<mapboxgl.Marker | null>(null)
  const gebaute = useRef<mapboxgl.Marker[]>([])
  const hatZentriert = useRef(false)
  const { bloecke } = useBauen()
  const spieler = useSpielerOrt()
  const spielerRef = useRef(spieler)
  spielerRef.current = spieler

  useEffect(() => {
    if (!kasten.current) return
    const el = kasten.current
    let map: mapboxgl.Map | undefined
    let cancelled = false

    void (async () => {
      const antwort = await fetch("/api/mapbox/session")
      const { accessToken } = (await antwort.json()) as { accessToken: string }
      if (cancelled || !el) return
      mapboxgl.accessToken = accessToken

      const start =
        spielerRef.current.status === "bereit"
          ? kameraFuerSpieler(spielerRef.current.lage)
          : {
              center: [BERN_KARTE.lng, BERN_KARTE.lat] as [number, number],
              zoom: SPIELER_KAMERA.zoom,
              pitch: SPIELER_KAMERA.pitch,
              bearing: SPIELER_KAMERA.bearing,
            }

      map = new mapboxgl.Map({
        container: el,
        style: "mapbox://styles/mapbox/streets-v12",
        center: start.center,
        zoom: start.zoom,
        pitch: start.pitch,
        bearing: start.bearing,
        minZoom: SPIELER_KAMERA.minZoom,
        maxZoom: SPIELER_KAMERA.maxZoom,
        antialias: true,
        attributionControl: true,
        preserveDrawingBuffer: true,
      })
      karte.current = map

      map.on("load", () => {
        if (!map) return
        applyMinecraftLook(map)
        if (!map.getLayer("minecraft-buildings")) {
          map.addLayer(MINECRAFT_GEBAEUDE)
        }
        for (const modell of listSichtModelle()) {
          new mapboxgl.Marker({
            element: truheElement(modell),
            anchor: "bottom",
          })
            .setLngLat([modell.lage.lng, modell.lage.lat])
            .addTo(map)
        }
        setzeSpielerMarker(map, spielerMarker, spielerRef.current)
        if (spielerRef.current.status === "bereit") {
          map.jumpTo(kameraFuerSpieler(spielerRef.current.lage))
          hatZentriert.current = true
        }
      })
    })()

    return () => {
      cancelled = true
      gebaute.current.forEach((marker) => marker.remove())
      gebaute.current = []
      spielerMarker.current?.remove()
      spielerMarker.current = null
      karte.current = null
      map?.remove()
    }
  }, [])

  useEffect(() => {
    const map = karte.current
    if (!map) return

    const zeichne = () => {
      gebaute.current.forEach((marker) => marker.remove())
      gebaute.current = bloecke.map((block) => {
        const item = gegenstandById(block.gegenstandId)
        return new mapboxgl.Marker({
          element: isoBlockElement(block.gegenstandId, item?.textur),
          anchor: "bottom",
        })
          .setLngLat([block.lng, block.lat])
          .addTo(map)
      })
    }

    if (map.loaded()) zeichne()
    else map.once("load", zeichne)
    return () => {
      map.off("load", zeichne)
    }
  }, [bloecke])

  useEffect(() => {
    const map = karte.current
    if (!map) return
    setzeSpielerMarker(map, spielerMarker, spieler)
    if (spieler.status === "bereit" && !hatZentriert.current) {
      const geheHin = () => {
        map.easeTo({ ...kameraFuerSpieler(spieler.lage), duration: 700 })
        hatZentriert.current = true
      }
      if (map.loaded()) geheHin()
      else map.once("load", geheHin)
    }
  }, [spieler])

  function zentriereAufMich() {
    const map = karte.current
    if (!map || spieler.status !== "bereit") return
    map.easeTo({ ...kameraFuerSpieler(spieler.lage), duration: 600 })
  }

  return (
    <div className="mc-map3d" data-testid="mapbox-gl-map">
      <div ref={kasten} className="mc-mapbox-canvas" />
      <button
        type="button"
        className="mc-ort-btn"
        onClick={zentriereAufMich}
        disabled={spieler.status !== "bereit"}
        aria-label="Hier zentrieren"
      >
        Hier
      </button>
      {spieler.status !== "bereit" ? (
        <p className="mc-ort-status" data-testid="spieler-ort">
          {spieler.status === "verweigert"
            ? "Standort blockiert — erlaube den Ort"
            : spieler.status === "fehler"
              ? "Standort nicht verfügbar"
              : "Suche Standort…"}
        </p>
      ) : (
        <p className="sr-only" data-testid="spieler-ort">
          Standort bereit
        </p>
      )}
      <ul className="sr-only">
        {listSichtModelle().map((modell) => (
          <li key={modell.id}>
            {modell.name} {modell.alias.join(" ")} {modell.modellId}
          </li>
        ))}
      </ul>
    </div>
  )
}

function truheElement(modell: SichtModell) {
  const root = document.createElement("div")
  root.className = "mc-gl-marker"
  root.dataset.sight = modell.id
  root.dataset.modell = modell.modellId
  root.innerHTML = `
    <a href="/sehenswuerdigkeiten/${modell.id}" aria-label="${modell.name}">
      <span class="mc-truhe mc-truhe-karte">
        <span class="mc-truhe-scene">
          <span class="mc-truhe-deckel">
            <span class="mc-face mc-face-front"></span>
            <span class="mc-face mc-face-side"></span>
            <span class="mc-face mc-face-top"></span>
          </span>
          <span class="mc-truhe-korpus">
            <span class="mc-face mc-face-front"></span>
            <span class="mc-face mc-face-side"></span>
            <span class="mc-face mc-face-top"></span>
          </span>
          <span class="mc-truhe-riegel"></span>
        </span>
      </span>
      <span class="mc-gl-label">${modell.name}</span>
    </a>
  `
  root.querySelector("a")?.addEventListener("click", (event) => {
    event.stopPropagation()
  })
  return root
}

function setzeSpielerMarker(
  map: mapboxgl.Map,
  markerRef: { current: mapboxgl.Marker | null },
  spieler: ReturnType<typeof useSpielerOrt>,
) {
  if (spieler.status !== "bereit") return
  const { lng, lat } = spieler.lage
  if (!markerRef.current) {
    markerRef.current = new mapboxgl.Marker({
      element: spielerElement(),
      anchor: "bottom",
    })
      .setLngLat([lng, lat])
      .addTo(map)
  } else {
    markerRef.current.setLngLat([lng, lat])
  }
}

function spielerElement() {
  const root = document.createElement("div")
  root.className = "mc-spieler"
  root.dataset.spieler = "hier"
  root.innerHTML = `
    <span class="mc-iso mc-iso-spieler">
      <span class="mc-face mc-face-front"></span>
      <span class="mc-face mc-face-side"></span>
      <span class="mc-face mc-face-top"></span>
    </span>
  `
  return root
}

function isoBlockElement(id: string, textur?: string) {
  const root = document.createElement("div")
  root.className = "mc-gl-marker"
  root.dataset.gebaut = id
  const url = textur ?? "/bloecke/erde.png"
  root.innerHTML = `
    <span class="mc-iso mc-iso-klein">
      <span class="mc-face mc-face-front" style="background-image:url('${url}')"></span>
      <span class="mc-face mc-face-side" style="background-image:url('${url}')"></span>
      <span class="mc-face mc-face-top" style="background-image:url('${url}')"></span>
    </span>
  `
  return root
}
