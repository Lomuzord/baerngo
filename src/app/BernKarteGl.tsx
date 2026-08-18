"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { BERN_KARTE } from "@/lib/karte"
import { applyMinecraftLook, MINECRAFT_GEBAEUDE } from "@/lib/minecraftStyle"
import { gegenstandById } from "@/lib/gegenstaende"
import { listSichtModelle, type SichtModell } from "@/lib/platzierung"
import { useBauen } from "./useBauen"
import { useSpielerOrt } from "./useSpielerOrt"

export function BernKarteGl() {
  const kasten = useRef<HTMLDivElement>(null)
  const karte = useRef<mapboxgl.Map | null>(null)
  const spielerMarker = useRef<mapboxgl.Marker | null>(null)
  const { bloecke } = useBauen()
  const spieler = useSpielerOrt()
  const spielerRef = useRef(spieler)
  spielerRef.current = spieler

  useEffect(() => {
    if (!kasten.current) return
    const el = kasten.current
    let map: mapboxgl.Map | undefined
    let cancelled = false
    const extra: mapboxgl.Marker[] = []

    void (async () => {
      const antwort = await fetch("/api/mapbox/session")
      const { accessToken } = (await antwort.json()) as { accessToken: string }
      if (cancelled || !el) return
      mapboxgl.accessToken = accessToken
      map = new mapboxgl.Map({
        container: el,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [BERN_KARTE.lng, BERN_KARTE.lat],
        zoom: 15.4,
        pitch: 58,
        bearing: -18,
        antialias: true,
        attributionControl: true,
        preserveDrawingBuffer: true,
      })
      karte.current = map
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
          showAccuracyCircle: true,
        }),
        "top-right",
      )
      map.on("load", () => {
        if (!map) return
        applyMinecraftLook(map)
        if (!map.getLayer("minecraft-buildings")) {
          map.addLayer(MINECRAFT_GEBAEUDE)
        }
        for (const modell of listSichtModelle()) {
          new mapboxgl.Marker({ element: blockElement(modell), anchor: "bottom" })
            .setLngLat([modell.lage.lng, modell.lage.lat])
            .addTo(map)
        }
        setzeSpielerMarker(map, spielerMarker, spielerRef.current, true)
        for (const block of bloecke) {
          const item = gegenstandById(block.gegenstandId)
          extra.push(
            new mapboxgl.Marker({
              element: gebauterBlock(block.gegenstandId, item?.textur),
              anchor: "bottom",
            })
              .setLngLat([block.lng, block.lat])
              .addTo(map),
          )
        }
      })
    })()

    return () => {
      cancelled = true
      extra.forEach((marker) => marker.remove())
      spielerMarker.current?.remove()
      spielerMarker.current = null
      karte.current = null
      map?.remove()
    }
  }, [bloecke])

  useEffect(() => {
    const map = karte.current
    if (!map) return
    setzeSpielerMarker(map, spielerMarker, spieler, !spielerMarker.current)
  }, [spieler])

  return (
    <div className="mc-map3d" data-testid="mapbox-gl-map">
      <div ref={kasten} className="mc-mapbox-canvas" />
      <p className="mc-you-hud" data-testid="spieler-ort">
        {spieler.status === "bereit"
          ? `Du bist hier · ${spieler.lage.lat.toFixed(5)}, ${spieler.lage.lng.toFixed(5)}`
          : spieler.status === "verweigert"
            ? "Standort blockiert — erlaube den Ort"
            : spieler.status === "fehler"
              ? "Standort nicht verfügbar"
              : "Suche deinen Standort…"}
      </p>
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

function blockElement(modell: SichtModell) {
  const root = document.createElement("div")
  root.className = "mc-gl-marker"
  root.dataset.sight = modell.id
  root.dataset.modell = modell.modellId
  root.innerHTML = `
    <a href="/sehenswuerdigkeiten/${modell.id}" aria-label="${modell.name}">
      <span class="mc-gl-cube" style="background-image:url('${modell.textur}')"></span>
      <span class="mc-gl-label">${modell.name}</span>
    </a>
  `
  const link = root.querySelector("a")
  if (link) {
    link.addEventListener("click", (event) => {
      event.stopPropagation()
    })
  }
  return root
}

function setzeSpielerMarker(
  map: mapboxgl.Map,
  markerRef: { current: mapboxgl.Marker | null },
  spieler: ReturnType<typeof useSpielerOrt>,
  fliegeHin: boolean,
) {
  if (spieler.status !== "bereit") return
  const { lng, lat } = spieler.lage
  if (!markerRef.current) {
    markerRef.current = new mapboxgl.Marker({
      element: spielerElement(),
      anchor: "center",
    })
      .setLngLat([lng, lat])
      .addTo(map)
  } else {
    markerRef.current.setLngLat([lng, lat])
  }
  if (fliegeHin) {
    map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 16.2), duration: 700 })
  }
}

function spielerElement() {
  const root = document.createElement("div")
  root.className = "mc-you"
  root.dataset.spieler = "hier"
  root.innerHTML = `
    <span class="mc-you-pulse"></span>
    <span class="mc-you-dot"></span>
    <span class="mc-you-label">DU</span>
  `
  return root
}

function gebauterBlock(id: string, textur?: string) {
  const root = document.createElement("div")
  root.className = "mc-gl-marker"
  root.dataset.gebaut = id
  root.innerHTML = `<span class="mc-gl-cube" style="background-image:url('${textur ?? "/bloecke/erde.png"}')"></span>`
  return root
}
