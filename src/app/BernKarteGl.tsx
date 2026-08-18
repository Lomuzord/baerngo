"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { BERN_KARTE } from "@/lib/karte"
import { applyMinecraftLook, MINECRAFT_GEBAEUDE } from "@/lib/minecraftStyle"
import { listSichtModelle, type SichtModell } from "@/lib/platzierung"

export function BernKarteGl() {
  const kasten = useRef<HTMLDivElement>(null)

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
      })
    })()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [])

  return (
    <div className="mc-map3d" data-testid="mapbox-gl-map">
      <div ref={kasten} className="mc-mapbox-canvas" />
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
