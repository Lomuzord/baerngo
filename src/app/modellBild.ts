import { passeKameraAn } from "@/lib/szeneKamera"
import type { SichtMesh } from "@/lib/modelle"

// Rendert Sehenswürdigkeits-Modelle als Standbild für die Kartenmarker.
// WICHTIG: genau EIN geteilter WebGL-Kontext für alle Marker — ein
// Renderer pro Marker sprengt das Browser-Limit (~8-16 Kontexte) und
// wirft dann den Mapbox-Kontext raus: die Karte wird blau und leer.
const GROESSE =
  typeof window === "undefined"
    ? 296
    : Math.round(148 * Math.min(window.devicePixelRatio || 1, 3))

const bilder = new Map<string, Promise<string>>()

let geteilt: {
  THREE: typeof import("three")
  renderer: import("three").WebGLRenderer
} | null = null
let abbauTimer = 0
// Erst abbauen, wenn wirklich keine Aufnahme mehr unterwegs ist —
// sonst stirbt der Kontext mitten im Laden der langsameren Modelle.
let inArbeit = 0

async function renderKontext() {
  window.clearTimeout(abbauTimer)
  if (geteilt) return geteilt
  const THREE = await import("three")
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(1)
  renderer.setSize(GROESSE, GROESSE)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  geteilt = { THREE, renderer }
  return geteilt
}

// Nach getaner Arbeit den einen Kontext wieder freigeben — die
// fertigen Bilder bleiben im Cache, der Karte gehört der Platz.
function planeAbbau() {
  window.clearTimeout(abbauTimer)
  abbauTimer = window.setTimeout(() => {
    if (!geteilt || inArbeit > 0) return
    geteilt.renderer.dispose()
    geteilt.renderer.forceContextLoss()
    geteilt = null
  }, 4000)
}

export function modellAlsBild(
  mesh: SichtMesh,
  winkel = -0.6,
): Promise<string> {
  const schluessel = `${mesh.src}@${winkel}`
  const laufend = bilder.get(schluessel)
  if (laufend) return laufend
  const neu = renderBild(mesh, winkel).catch((fehler) => {
    bilder.delete(schluessel)
    throw fehler
  })
  bilder.set(schluessel, neu)
  return neu
}

async function renderBild(mesh: SichtMesh, winkel: number): Promise<string> {
  inArbeit += 1
  try {
    return await renderBildJetzt(mesh, winkel)
  } finally {
    inArbeit -= 1
    planeAbbau()
  }
}

async function renderBildJetzt(
  mesh: SichtMesh,
  winkel: number,
): Promise<string> {
  const { THREE, renderer } = await renderKontext()

  const szene = new THREE.Scene()
  const kamera = new THREE.PerspectiveCamera(32, 1, 0.05, 200)
  szene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const sonne = new THREE.DirectionalLight(0xfff1d0, 1.15)
  sonne.position.set(4, 8, 6)
  szene.add(sonne)

  let figur: import("three").Object3D
  if (mesh.format === "gltf") {
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js")
    figur = (await new GLTFLoader().loadAsync(mesh.src)).scene
  } else {
    const { ColladaLoader } = await import(
      "three/addons/loaders/ColladaLoader.js"
    )
    const collada = await new ColladaLoader().loadAsync(mesh.src)
    if (!collada?.scene) throw new Error("Collada-Modell fehlt")
    figur = collada.scene
    if (mesh.textur) {
      const textur = await new THREE.TextureLoader().loadAsync(mesh.textur)
      textur.colorSpace = THREE.SRGBColorSpace
      textur.flipY = false
      figur.traverse((objekt) => {
        if (objekt instanceof THREE.Mesh) {
          objekt.material = new THREE.MeshStandardMaterial({
            map: textur,
            roughness: 0.85,
          })
        }
      })
    }
  }

  const wurzel = new THREE.Group()
  wurzel.add(figur)
  szene.add(wurzel)
  // Blickwinkel wählbar: -0.6 = leicht gedreht, ~-0.15 = frontal
  wurzel.rotation.y = winkel
  passeKameraAn(kamera, wurzel, {
    padding: 1.55,
    richtung: { x: 0.7, y: 0.28, z: 1 },
  })
  renderer.render(szene, kamera)
  const bild = renderer.domElement.toDataURL("image/png")

  // Modellressourcen sofort freigeben — das Standbild reicht
  szene.traverse((objekt) => {
    if (objekt instanceof THREE.Mesh) {
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
  return bild
}
