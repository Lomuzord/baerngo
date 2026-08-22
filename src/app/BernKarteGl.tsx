"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { gegenstandById } from "@/lib/gegenstaende"
import {
  BERN_KARTE,
  kameraFuerSpieler,
  markerSkala,
  SPIELER_KAMERA,
} from "@/lib/karte"
import type { Lage } from "@/lib/katalog"
import { applyMinecraftLook, MINECRAFT_GEBAEUDE } from "@/lib/minecraftStyle"
import { meshFuerSehenswuerdigkeit } from "@/lib/modelle"
import { listSichtModelle, sichtModellById, type SichtModell } from "@/lib/platzierung"
import {
  distanzMeter,
  entfernungText,
  istNahGenug,
  kreisUm,
} from "@/lib/reichweite"
import { umweltAusMerkmalen, type Umwelt } from "@/lib/umwelt"
import { spieleHaptik } from "@/lib/haptik"
import { sammelRadius, type WildBlock } from "@/lib/wildspawn"
import { maleIsoWuerfel } from "./maleIsoWuerfel"
import { starteTrainerSzene, type TrainerRichtung } from "./starteTrainerSzene"
import { useInventar } from "./useInventar"
import { useSpielerOrt } from "./useSpielerOrt"
import { useWildspawn } from "./useWildspawn"

export function BernKarteGl({
  gewaehltId,
  onWaehle,
}: {
  gewaehltId: string | null
  onWaehle: (id: string | null) => void
}) {
  const kasten = useRef<HTMLDivElement>(null)
  const karte = useRef<mapboxgl.Map | null>(null)
  const spielerMarker = useRef<mapboxgl.Marker | null>(null)
  const wildMarker = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const trainerStop = useRef<(() => void) | null>(null)
  const modellBilder = useRef<Map<string, HTMLImageElement>>(new Map())
  const richtungsIndex = useRef(-1)
  const pins = useRef<Map<string, HTMLElement>>(new Map())
  const hatZentriert = useRef(false)
  const onWaehleRef = useRef(onWaehle)
  onWaehleRef.current = onWaehle
  const gewaehltRef = useRef(gewaehltId)
  gewaehltRef.current = gewaehltId
  const [hinweis, setHinweis] = useState<string | null>(null)
  const [karteBereit, setKarteBereit] = useState(false)
  // Zählt hoch, wenn der WebGL-Kontext der Karte verloren geht —
  // der Init-Effekt baut die Karte dann komplett neu auf.
  const [kartenLauf, setKartenLauf] = useState(0)

  useEffect(() => {
    if (!hinweis) return
    const timer = window.setTimeout(() => setHinweis(null), 2200)
    return () => window.clearTimeout(timer)
  }, [hinweis])
  const spieler = useSpielerOrt()
  const spielerRef = useRef(spieler)
  spielerRef.current = spieler
  const { sammle } = useInventar()
  const umweltAn = useCallback((lage: Lage): Umwelt => {
    const map = karte.current
    if (!map || !map.isStyleLoaded()) return "unbekannt"
    return umweltAusMerkmalen(merkmaleAn(map, lage))
  }, [])
  const { bloecke, nimm } = useWildspawn(spieler, umweltAn, karteBereit)
  const nimmRef = useRef(nimm)
  nimmRef.current = nimm
  const bloeckeRef = useRef(bloecke)
  bloeckeRef.current = bloecke
  const sammleRef = useRef(sammle)
  sammleRef.current = sammle

  useEffect(() => {
    if (!kasten.current) return
    const el = kasten.current
    let map: mapboxgl.Map | undefined
    let cancelled = false
    let neubauTimer = 0

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
      })
      karte.current = map

      // Sicherheitsnetz: Verliert die Karte ihren WebGL-Kontext (z. B.
      // weil der Browser Kontexte verdrängt), bleibt sonst nur eine
      // blaue Fläche zurück. Dann Karte neu aufbauen — höchstens 3-mal,
      // damit ein kranker GPU-Zustand keine Endlosschleife auslöst.
      map.getCanvas().addEventListener("webglcontextlost", () => {
        if (cancelled || kartenLauf >= 3) return
        neubauTimer = window.setTimeout(
          () => setKartenLauf((lauf) => lauf + 1),
          250,
        )
      })

      map.on("load", () => {
        if (!map) return
        applyMinecraftLook(map as never)
        if (!map.getLayer("minecraft-buildings")) {
          map.addLayer(MINECRAFT_GEBAEUDE as never)
        }
        pins.current.clear()
        for (const modell of listSichtModelle()) {
          const mesh = meshFuerSehenswuerdigkeit(modell.id)
          const el = mesh
            ? schwebeElement(modell, (id) => onWaehleRef.current(id))
            : pinElement(modell, (id) => onWaehleRef.current(id))
          if (modell.id === gewaehltRef.current) {
            el.classList.add(
              mesh ? "mc-pokestop-aktiv" : "mc-ort-pin-aktiv",
            )
          }
          pins.current.set(modell.id, el)
          new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([modell.lage.lng, modell.lage.lat])
            .addTo(map)
          if (mesh) {
            const buehne = el.querySelector<HTMLElement>(".mc-pokestop-buehne")
            if (buehne) {
              const img = document.createElement("img")
              img.alt = ""
              img.draggable = false
              img.className = "mc-pokestop-bild"
              img.src = `/marker/${modell.id}-0.png`
              buehne.replaceChildren(img)
              modellBilder.current.set(modell.id, img)
            }
          }
        }
        map.on("click", () => {
          onWaehleRef.current(null)
        })
        if (spielerRef.current.status === "bereit") {
          setzeSammelring(
            map,
            spielerRef.current.lage,
            sammelRadius(spielerRef.current.genauigkeit),
          )
        }
        setzeSpielerMarker(
          map,
          spielerMarker,
          spielerRef.current,
          trainerStop,
          () => trainerRichtung(karte.current, spielerRef.current),
        )
        if (gewaehltRef.current) {
          // Deeplink mit ?ort=… — direkt zur gewählten Sehenswürdigkeit
          const modell = sichtModellById(gewaehltRef.current)
          if (modell) {
            map.jumpTo({
              center: [modell.lage.lng, modell.lage.lat],
              zoom: SPIELER_KAMERA.zoom,
              pitch: SPIELER_KAMERA.pitch,
              bearing: SPIELER_KAMERA.bearing,
            })
            hatZentriert.current = true
          }
        } else if (spielerRef.current.status === "bereit") {
          zentriereAufLage(map, spielerRef.current.lage, hatZentriert)
        }
        passeMarkerSkalaAn(map)
        map.on("zoom", () => {
          const aktiv = karte.current
          if (aktiv) passeMarkerSkalaAn(aktiv)
        })
        map.on("rotate", () => {
          const aktiv = karte.current
          if (aktiv) {
            passeMarkerSkalaAn(aktiv)
            aktualisiereModellRichtung(aktiv)
          }
        })
        aktualisiereModellRichtung(map)
        map.once("idle", () => setKarteBereit(true))
      })
    })()

    return () => {
      cancelled = true
      window.clearTimeout(neubauTimer)
      setKarteBereit(false)
      wildMarker.current.forEach((marker) => marker.remove())
      wildMarker.current.clear()
      modellBilder.current.clear()
      richtungsIndex.current = -1
      trainerStop.current?.()
      trainerStop.current = null
      spielerMarker.current?.remove()
      spielerMarker.current = null
      karte.current = null
      map?.remove()
    }
    // kartenLauf erzwingt den Neuaufbau nach Kontextverlust
  }, [kartenLauf])

  useEffect(() => {
    const map = karte.current
    if (!map) return
    if (spieler.status === "bereit" && map.isStyleLoaded()) {
      setzeSammelring(map, spieler.lage, sammelRadius(spieler.genauigkeit))
    }
    setzeSpielerMarker(
      map,
      spielerMarker,
      spieler,
      trainerStop,
      () => trainerRichtung(karte.current, spielerRef.current),
    )
    if (spieler.status === "bereit" && !gewaehltRef.current) {
      const mitte = map.getCenter()
      const sprung = distanzMeter(spieler.lage, {
        lat: mitte.lat,
        lng: mitte.lng,
      })
      if (!hatZentriert.current || sprung > 250) {
        hatZentriert.current = false
        zentriereAufLage(map, spieler.lage, hatZentriert)
      }
    }
  }, [spieler])

  useEffect(() => {
    const map = karte.current
    if (!map) return
    const leben = new Set(bloecke.map((block) => block.id))
    const lage = spieler.status === "bereit" ? spieler.lage : null
    const reichweite =
      spieler.status === "bereit" ? sammelRadius(spieler.genauigkeit) : 0
    for (const block of bloecke) {
      const nah = lage
        ? istNahGenug(lage, block.lage, reichweite)
        : false
      let marker = wildMarker.current.get(block.id)
      if (!marker) {
        marker = new mapboxgl.Marker({
          element: wildElement(block, (id) => {
            const aktuell = spielerRef.current
            if (aktuell.status !== "bereit") {
              setHinweis("Standort fehlt")
              return
            }
            const ziel =
              bloeckeRef.current.find((eintrag) => eintrag.id === id) ?? block
            const distanz = distanzMeter(aktuell.lage, ziel.lage)
            const reich = sammelRadius(aktuell.genauigkeit)
            if (distanz > reich) {
              spieleHaptik("zu-weit")
              setHinweis(`Noch ${entfernungText(distanz - reich)}`)
              return
            }
            const weg = nimmRef.current(id)
            if (!weg) {
              setHinweis("Block ist weg")
              return
            }
            sammleRef.current(weg.gegenstandId)
            spieleHaptik("sammeln")
            const name = gegenstandById(weg.gegenstandId)?.name ?? weg.gegenstandId
            setHinweis(`+1 ${name}`)
          }),
          anchor: "bottom",
        })
          .setLngLat([block.lage.lng, block.lage.lat])
          .addTo(map)
        wildMarker.current.set(block.id, marker)
      }
      marker.getElement().classList.toggle("mc-wild-nah", nah)
    }
    for (const [id, marker] of wildMarker.current) {
      if (leben.has(id)) continue
      marker.remove()
      wildMarker.current.delete(id)
    }
  }, [bloecke, spieler, karteBereit])

  useEffect(() => {
    pins.current.forEach((el, id) => {
      const istStop = el.classList.contains("mc-pokestop")
      el.classList.toggle(
        istStop ? "mc-pokestop-aktiv" : "mc-ort-pin-aktiv",
        id === gewaehltId,
      )
    })
    const map = karte.current
    const modell = gewaehltId ? sichtModellById(gewaehltId) : undefined
    if (!map || !modell) return
    const geheHin = () => {
      map.easeTo({
        center: [modell.lage.lng, modell.lage.lat],
        zoom: Math.max(map.getZoom(), SPIELER_KAMERA.zoom),
        duration: 500,
      })
    }
    geheHin()
  }, [gewaehltId])

  function aktualisiereModellRichtung(map: mapboxgl.Map) {
    // Vier vorgerenderte Himmelsrichtungen pro Bauwerk — beim Drehen
    // wird nur die Bildquelle getauscht, es wird nichts gerendert.
    const index = ((Math.round(-map.getBearing() / 90) % 4) + 4) % 4
    if (index === richtungsIndex.current) return
    richtungsIndex.current = index
    modellBilder.current.forEach((img, id) => {
      img.src = `/marker/${id}-${index}.png`
    })
  }

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
      {hinweis ? <p className="mc-wild-hinweis">{hinweis}</p> : null}
      <p className="mc-wild-zahl">
        {bloecke.length} Blöcke in der Nähe
      </p>
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

let letzteSkala = 0
function passeMarkerSkalaAn(map: mapboxgl.Map) {
  // Läuft sonst bei jeder Zoom-Frame — nur schreiben, wenn sich der
  // Wert spürbar ändert, damit nicht alle Marker pro Frame neu layouten
  const skala = markerSkala(map.getZoom())
  if (Math.abs(skala - letzteSkala) < 0.04) return
  letzteSkala = skala
  map.getContainer().style.setProperty("--mc-marker-skala", String(skala))
}

function trainerRichtung(
  map: mapboxgl.Map | null,
  spieler: ReturnType<typeof useSpielerOrt>,
): TrainerRichtung {
  if (spieler.status !== "bereit") return { karte: map?.getBearing() ?? 0 }
  return {
    blick: spieler.blick,
    karte: map?.getBearing() ?? SPIELER_KAMERA.bearing,
    pitch: map?.getPitch() ?? SPIELER_KAMERA.pitch,
    geht: Boolean(spieler.geht),
  }
}

function zentriereAufLage(
  map: mapboxgl.Map,
  lage: Lage,
  fertig: { current: boolean },
) {
  if (fertig.current) return
  const geheHin = () => {
    if (fertig.current) return
    map.resize()
    map.jumpTo(kameraFuerSpieler(lage))
    fertig.current = true
  }
  if (map.isStyleLoaded()) {
    geheHin()
    return
  }
  map.once("idle", geheHin)
}

function setzeSammelring(map: mapboxgl.Map, lage: Lage, radiusMeter: number) {
  const ring = kreisUm(lage, radiusMeter).map((punkt) => [
    punkt.lng,
    punkt.lat,
  ])
  ring.push(ring[0]!)
  const daten = {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: [ring] },
    properties: {},
  }
  const quelle = map.getSource("sammelring") as mapboxgl.GeoJSONSource | undefined
  if (quelle) {
    quelle.setData(daten)
    return
  }
  map.addSource("sammelring", { type: "geojson", data: daten })
  map.addLayer({
    id: "sammelring-fill",
    type: "fill",
    source: "sammelring",
    paint: {
      "fill-color": "#2ec8ff",
      "fill-opacity": 0.14,
    },
  })
  map.addLayer({
    id: "sammelring-linie",
    type: "line",
    source: "sammelring",
    paint: {
      "line-color": "#7ef0ff",
      "line-width": 2,
      "line-opacity": 0.7,
    },
  })
}

function merkmaleAn(map: mapboxgl.Map, lage: Lage) {
  const punkt = map.project([lage.lng, lage.lat])
  const canvas = map.getCanvas()
  if (
    punkt.x < -24 ||
    punkt.y < -24 ||
    punkt.x > canvas.clientWidth + 24 ||
    punkt.y > canvas.clientHeight + 24
  ) {
    return []
  }
  const box: [mapboxgl.PointLike, mapboxgl.PointLike] = [
    [punkt.x - 28, punkt.y - 28],
    [punkt.x + 28, punkt.y + 28],
  ]
  return map.queryRenderedFeatures(box).map((feature) => ({
    layerId: feature.layer?.id ?? "",
    typ: feature.layer?.type,
    klasse:
      typeof feature.properties?.class === "string"
        ? feature.properties.class
        : undefined,
  }))
}

function schwebeElement(
  modell: SichtModell,
  onWaehle: (id: string) => void,
) {
  const root = document.createElement("button")
  root.type = "button"
  root.className = "mc-pokestop"
  root.dataset.sight = modell.id
  root.dataset.modell = modell.modellId
  root.setAttribute("aria-label", modell.name)
  root.innerHTML = `
    <span class="mc-pokestop-inhalt">
      <span class="mc-pokestop-schwebe">
        <span class="mc-pokestop-buehne"></span>
      </span>
      <span class="mc-pokestop-scheibe"></span>
      <span class="mc-pokestop-ring"></span>
    </span>
  `
  root.addEventListener("click", (event) => {
    event.stopPropagation()
    onWaehle(modell.id)
  })
  return root
}

function pinElement(
  modell: SichtModell,
  onWaehle: (id: string) => void,
) {
  const root = document.createElement("button")
  root.type = "button"
  root.className = "mc-ort-pin mc-ort-pin-map"
  root.dataset.sight = modell.id
  root.dataset.modell = modell.modellId
  root.setAttribute("aria-label", modell.name)
  root.innerHTML = `
    <span class="mc-ort-pin-raute"></span>
    <span class="mc-ort-pin-stiel"></span>
  `
  root.addEventListener("click", (event) => {
    event.stopPropagation()
    onWaehle(modell.id)
  })
  return root
}

function wildElement(
  block: WildBlock,
  onTipp: (id: string) => void,
) {
  const item = gegenstandById(block.gegenstandId)
  const textur = item?.textur ?? "/bloecke/erde.png"
  const seite =
    block.gegenstandId === "gras" ? "/bloecke/erde.png" : textur
  const root = document.createElement("button")
  root.type = "button"
  root.className = "mc-wild"
  root.dataset.haptik = "aus"
  root.dataset.wild = block.id
  root.dataset.umwelt = block.umwelt
  root.setAttribute("aria-label", item?.name ?? block.gegenstandId)
  root.innerHTML = `
    <span class="mc-wild-schwebe"></span>
    <span class="mc-wild-schatten"></span>
  `
  const buehne = root.querySelector<HTMLElement>(".mc-wild-schwebe")
  if (buehne) void maleIsoWuerfel(buehne, textur, seite)
  let start: { x: number; y: number } | null = null
  let perZeiger = false
  let perZeigerTimer = 0
  root.addEventListener("pointerdown", (event) => {
    if (event.button === 2) return
    // KEIN stopPropagation: sonst kann die Karte nicht mehr gepannt
    // werden, wenn die Geste auf einem Block beginnt.
    perZeiger = true
    window.clearTimeout(perZeigerTimer)
    perZeigerTimer = window.setTimeout(() => {
      perZeiger = false
    }, 500)
    start = { x: event.clientX, y: event.clientY }
  })
  root.addEventListener("pointerup", (event) => {
    if (!start) return
    const ruhig =
      Math.hypot(event.clientX - start.x, event.clientY - start.y) < 22
    start = null
    if (ruhig) {
      event.stopPropagation()
      onTipp(block.id)
    }
  })
  root.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (perZeiger) {
      perZeiger = false
      return
    }
    onTipp(block.id)
  })
  return root
}

function setzeSpielerMarker(
  map: mapboxgl.Map,
  markerRef: { current: mapboxgl.Marker | null },
  spieler: ReturnType<typeof useSpielerOrt>,
  trainerStop: { current: (() => void) | null },
  blick: () => TrainerRichtung,
) {
  if (spieler.status !== "bereit") return
  const { lng, lat } = spieler.lage
  if (!markerRef.current) {
    const el = spielerElement()
    markerRef.current = new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat([lng, lat])
      .addTo(map)
    const buehne = el.querySelector<HTMLElement>(".mc-trainer-buehne")
    if (buehne) {
      void starteTrainerSzene(buehne, blick).then((stop) => {
        if (!el.isConnected) {
          stop()
          return
        }
        trainerStop.current?.()
        trainerStop.current = stop
      })
    }
  } else {
    markerRef.current.setLngLat([lng, lat])
  }
}

function spielerElement() {
  const root = document.createElement("div")
  root.className = "mc-trainer"
  root.dataset.spieler = "hier"
  root.innerHTML = `
    <span class="mc-trainer-mass">
      <span class="mc-trainer-schatten"></span>
      <span class="mc-trainer-ring"></span>
      <span class="mc-trainer-ring mc-trainer-ring-2"></span>
      <span class="mc-trainer-schwebe">
        <span class="mc-trainer-buehne"></span>
      </span>
    </span>
  `
  return root
}
