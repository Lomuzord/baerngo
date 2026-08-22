import mapboxgl from "mapbox-gl"
import { meshFuerSehenswuerdigkeit } from "@/lib/modelle"
import { listSichtModelle } from "@/lib/platzierung"

// Rendert die Voxel-Sehenswürdigkeiten als ECHTE 3D-Objekte in der
// Karte selbst (Mapbox Custom Layer, teilt sich den WebGL-Kontext der
// Karte — kein zusätzlicher Kontext). Dadurch stehen die Bauwerke fest
// in der Welt: sie drehen mit, wenn man die Karte dreht, und wachsen
// beim Heranzoomen wie richtige Gebäude.

// Wie viele Meter ein Voxel in der Welt einnimmt — bewusst leicht
// überhöht, damit die Bauwerke als Landmarken wirken.
const EINHEIT_METER = 1.6

type Drei = typeof import("three")

export type SichtEbene = mapboxgl.CustomLayerInterface & {
  setzeWahl: (id: string | null) => void
}

export function erstelleSichtEbene(): SichtEbene {
  let THREE: Drei | null = null
  let renderer: import("three").WebGLRenderer | null = null
  let szene: import("three").Scene | null = null
  let kamera: import("three").Camera | null = null
  let karte: mapboxgl.Map | null = null
  const gruppen = new Map<string, import("three").Group>()
  let wahlId: string | null = null

  return {
    id: "sicht-modelle-3d",
    type: "custom",
    renderingMode: "3d",

    onAdd(map, gl) {
      karte = map
      void (async () => {
        THREE = await import("three")
        const { GLTFLoader } = await import(
          "three/addons/loaders/GLTFLoader.js"
        )
        szene = new THREE.Scene()
        kamera = new THREE.Camera()
        szene.add(new THREE.AmbientLight(0xffffff, 0.95))
        const sonne = new THREE.DirectionalLight(0xfff1d0, 1.1)
        sonne.position.set(0.5, -0.7, 1)
        szene.add(sonne)
        renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl as WebGL2RenderingContext,
          antialias: true,
        })
        renderer.autoClear = false

        const loader = new GLTFLoader()
        for (const modell of listSichtModelle()) {
          const mesh = meshFuerSehenswuerdigkeit(modell.id)
          if (!mesh || mesh.format !== "gltf") continue
          void loader
            .loadAsync(mesh.src)
            .then((gltf) => {
              if (!THREE || !szene) return
              const merc = mapboxgl.MercatorCoordinate.fromLngLat(
                [modell.lage.lng, modell.lage.lat],
                0,
              )
              const skala =
                merc.meterInMercatorCoordinateUnits() * EINHEIT_METER
              const gruppe = new THREE.Group()
              gruppe.add(gltf.scene)
              gruppe.position.set(merc.x, merc.y, merc.z ?? 0)
              gruppe.scale.set(skala, -skala, skala)
              gruppe.rotation.x = Math.PI / 2
              gruppe.userData.grundSkala = skala
              szene.add(gruppe)
              gruppen.set(modell.id, gruppe)
              map.triggerRepaint()
            })
            .catch(() => {})
        }
      })()
    },

    render(_gl, matrix) {
      if (!THREE || !renderer || !szene || !kamera) return
      // Gewähltes Bauwerk sanft pulsieren lassen
      if (wahlId) {
        const gruppe = gruppen.get(wahlId)
        if (gruppe) {
          const basis = gruppe.userData.grundSkala as number
          const puls = 1 + Math.sin(performance.now() / 280) * 0.06
          gruppe.scale.set(basis * puls, -basis * puls, basis * puls)
        }
        karte?.triggerRepaint()
      }
      kamera.projectionMatrix = new THREE.Matrix4().fromArray(
        matrix as number[],
      )
      renderer.resetState()
      renderer.render(szene, kamera)
    },

    onRemove() {
      if (szene) {
        szene.traverse((objekt) => {
          if (THREE && objekt instanceof THREE.Mesh) {
            objekt.geometry.dispose()
            const materialien = Array.isArray(objekt.material)
              ? objekt.material
              : [objekt.material]
            for (const material of materialien) {
              const mitTextur = material as {
                map?: { dispose(): void } | null
                dispose(): void
              }
              mitTextur.map?.dispose()
              material.dispose()
            }
          }
        })
      }
      // Kontext gehört der Karte — nur unsere Ressourcen freigeben
      renderer?.dispose()
      renderer = null
      szene = null
      kamera = null
      gruppen.clear()
    },

    setzeWahl(id: string | null) {
      if (wahlId && wahlId !== id) {
        const alte = gruppen.get(wahlId)
        if (alte) {
          const basis = alte.userData.grundSkala as number
          alte.scale.set(basis, -basis, basis)
        }
      }
      wahlId = id
      karte?.triggerRepaint()
    },
  }
}
