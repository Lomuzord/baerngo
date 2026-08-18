import { webXrFeatures, webXrModus } from "@/lib/ar"
import { gegenstandById } from "@/lib/gegenstaende"
import type { GesetzterBlock } from "@/lib/bauen"

export type ArSteuerung = {
  wahl: () => string | null
  kannSetzen: () => boolean
  kannAbbauen: () => boolean
  bloecke: () => GesetzterBlock[]
  aufSetzen: (pose: { x: number; y: number; z: number }) => void
  aufAbbauen: (blockId: string) => void
}

export async function starteBauenAr(
  leinwand: HTMLCanvasElement,
  steuerung: ArSteuerung,
): Promise<{ beenden: () => void }> {
  const xr = navigator.xr
  if (!xr) throw new Error("WebXR fehlt")
  const modus = webXrModus()
  const erlaubt = await xr.isSessionSupported(modus)
  if (!erlaubt) throw new Error("immersive-ar nicht verfügbar")

  const THREE = await import("three")
  const session = await xr.requestSession(modus, {
    requiredFeatures: webXrFeatures(),
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: leinwand.parentElement ?? document.body },
  })

  const renderer = new THREE.WebGLRenderer({
    canvas: leinwand,
    antialias: true,
    alpha: true,
  })
  renderer.xr.enabled = true
  await renderer.xr.setSession(session)

  const szene = new THREE.Scene()
  const kamera = new THREE.PerspectiveCamera()
  szene.add(new THREE.AmbientLight(0xffffff, 1))
  const sonne = new THREE.DirectionalLight(0xffffff, 0.8)
  sonne.position.set(1, 3, 2)
  szene.add(sonne)

  const visier = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.08, 24),
    new THREE.MeshBasicMaterial({ color: 0x7cfc00, side: THREE.DoubleSide }),
  )
  visier.rotation.x = -Math.PI / 2
  visier.visible = false
  szene.add(visier)

  const wuerfel = new Map<string, THREE.Mesh>()
  const kanten = 0.2

  function zeichneBloecke() {
    const leben = new Set<string>()
    for (const block of steuerung.bloecke()) {
      if (!block.ar) continue
      leben.add(block.id)
      let mesh = wuerfel.get(block.id)
      if (!mesh) {
        const farbe = farbeFuer(block.gegenstandId)
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(kanten, kanten, kanten),
          new THREE.MeshStandardMaterial({ color: farbe }),
        )
        mesh.userData.blockId = block.id
        szene.add(mesh)
        wuerfel.set(block.id, mesh)
      }
      mesh.position.set(block.ar.x, block.ar.y + kanten / 2, block.ar.z)
    }
    for (const [id, mesh] of wuerfel) {
      if (leben.has(id)) continue
      szene.remove(mesh)
      mesh.geometry.dispose()
      wuerfel.delete(id)
    }
  }

  const viewer = await session.requestReferenceSpace("viewer")
  const hitQuelle = await session.requestHitTestSource?.({ space: viewer })
  const ray = new THREE.Raycaster()

  function waehle() {
    zeichneBloecke()
    if (steuerung.kannAbbauen()) {
      const origin = new THREE.Vector3()
      const richtung = new THREE.Vector3(0, 0, -1)
      kamera.getWorldPosition(origin)
      kamera.getWorldDirection(richtung)
      ray.set(origin, richtung)
      const treffer = ray.intersectObjects([...wuerfel.values()], false)[0]
      const id = treffer?.object.userData.blockId as string | undefined
      if (id) {
        steuerung.aufAbbauen(id)
        zeichneBloecke()
        return
      }
    }
    if (!steuerung.kannSetzen() || !visier.visible) return
    steuerung.aufSetzen({
      x: visier.position.x,
      y: visier.position.y,
      z: visier.position.z,
    })
    zeichneBloecke()
  }

  session.addEventListener("select", waehle)

  renderer.setAnimationLoop((_zeit, frame) => {
    if (!frame || !hitQuelle) {
      renderer.render(szene, kamera)
      return
    }
    const hits = frame.getHitTestResults(hitQuelle)
    if (hits[0]) {
      const pose = hits[0].getPose(renderer.xr.getReferenceSpace()!)
      if (pose) {
        visier.visible = true
        visier.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z,
        )
      }
    } else {
      visier.visible = false
    }
    zeichneBloecke()
    renderer.render(szene, kamera)
  })

  function beenden() {
    session.removeEventListener("select", waehle)
    renderer.setAnimationLoop(null)
    void session.end()
    renderer.dispose()
  }
  session.addEventListener("end", () => {
    renderer.setAnimationLoop(null)
  })

  return { beenden }
}

function farbeFuer(id: string): number {
  const name = gegenstandById(id)?.id ?? id
  const tabelle: Record<string, number> = {
    gold: 0xf1c232,
    sandstein: 0xc2a06a,
    honig: 0xe09b1b,
    smaragd: 0x2ecc71,
    stein: 0x888888,
    holz: 0x8b5a2b,
    eisen: 0xc6c6c6,
    erde: 0x6b4224,
    gras: 0x5b8c3a,
    kies: 0x887e6c,
    ziegel: 0x964637,
    goldblock: 0xffd700,
    pickel: 0xbbbbbb,
    schwert: 0xdddddd,
  }
  return tabelle[name] ?? 0x8b5a2b
}
