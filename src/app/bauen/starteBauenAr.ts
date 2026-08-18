import { webXrFeatures, webXrModus } from "@/lib/ar"
import type { GesetzterBlock } from "@/lib/bauen"
import { gegenstandById } from "@/lib/gegenstaende"
import {
  BLOCK_KANTE_METER,
  EBENE_RADIUS_ZELLEN,
  setzPose,
  type Ebene,
} from "@/lib/spielflaeche"

export type ArSteuerung = {
  wahl: () => string | null
  kannSetzen: () => boolean
  werkzeug: () => string | null
  bloecke: () => GesetzterBlock[]
  aufSetzen: (pose: { x: number; y: number; z: number }) => void
  aufSchlag: (blockId: string) => boolean
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
    optionalFeatures: ["dom-overlay", "plane-detection"],
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
  const sonne = new THREE.DirectionalLight(0xffffff, 0.85)
  sonne.position.set(1, 3, 2)
  szene.add(sonne)

  const kante = BLOCK_KANTE_METER
  let ebene: Ebene | null = null
  let gitter: THREE.Object3D | null = null

  const visier = new THREE.Mesh(
    new THREE.BoxGeometry(kante * 0.98, 0.008, kante * 0.98),
    new THREE.MeshBasicMaterial({
      color: 0x7cfc00,
      transparent: true,
      opacity: 0.7,
    }),
  )
  visier.visible = false
  szene.add(visier)

  const wuerfel = new Map<string, THREE.Mesh>()

  function sperreEbene(pose: { x: number; y: number; z: number }) {
    if (ebene) return
    ebene = { ursprung: { x: pose.x, y: pose.y, z: pose.z } }
    const seite = (EBENE_RADIUS_ZELLEN * 2 + 1) * kante
    const platte = new THREE.Mesh(
      new THREE.PlaneGeometry(seite, seite),
      new THREE.MeshBasicMaterial({
        color: 0x3d2b1f,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      }),
    )
    platte.rotation.x = -Math.PI / 2
    platte.position.set(pose.x, pose.y + 0.001, pose.z)
    const raster = new THREE.GridHelper(seite, EBENE_RADIUS_ZELLEN * 2 + 1, 0xf1c232, 0x7cfc00)
    raster.position.set(pose.x, pose.y + 0.002, pose.z)
    gitter = new THREE.Group()
    gitter.add(platte)
    gitter.add(raster)
    szene.add(gitter)
  }

  function zeichneBloecke() {
    const leben = new Set<string>()
    for (const block of steuerung.bloecke()) {
      if (!block.ar) continue
      leben.add(block.id)
      let mesh = wuerfel.get(block.id)
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(kante * 0.98, kante * 0.98, kante * 0.98),
          new THREE.MeshStandardMaterial({ color: farbeFuer(block.gegenstandId) }),
        )
        mesh.userData.blockId = block.id
        szene.add(mesh)
        wuerfel.set(block.id, mesh)
      }
      mesh.position.set(block.ar.x, block.ar.y + kante / 2, block.ar.z)
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
    const origin = new THREE.Vector3()
    const richtung = new THREE.Vector3(0, 0, -1)
    kamera.getWorldPosition(origin)
    kamera.getWorldDirection(richtung)
    ray.set(origin, richtung)
    const blockTreffer = ray.intersectObjects([...wuerfel.values()], false)[0]
    const wahl = steuerung.wahl()
    const schlaegt =
      !wahl || wahl === "pickel" || !steuerung.kannSetzen()

    if (blockTreffer && schlaegt) {
      const id = blockTreffer.object.userData.blockId as string | undefined
      if (id) steuerung.aufSchlag(id)
      zeichneBloecke()
      return
    }
    if (!steuerung.kannSetzen() || !visier.visible || !ebene) return
    const bestehende = steuerung
      .bloecke()
      .map((block) => block.ar)
      .filter((pose): pose is { x: number; y: number; z: number } => Boolean(pose))
    const zelle = setzPose(
      { x: visier.position.x, y: visier.position.y, z: visier.position.z },
      ebene,
      bestehende,
    )
    if (!zelle) return
    steuerung.aufSetzen(zelle)
    zeichneBloecke()
  }

  session.addEventListener("select", waehle)

  renderer.setAnimationLoop((_zeit, frame) => {
    if (!frame || !hitQuelle) {
      renderer.render(szene, kamera)
      return
    }
    const space = renderer.xr.getReferenceSpace()
    if (!space) {
      renderer.render(szene, kamera)
      return
    }
    const hits = frame.getHitTestResults(hitQuelle)
    if (hits[0]) {
      const pose = hits[0].getPose(space)
      if (pose) {
        const p = pose.transform.position
        sperreEbene({ x: p.x, y: p.y, z: p.z })
        visier.visible = true
        if (ebene) {
          const zelle = setzPose(
            { x: p.x, y: p.y, z: p.z },
            ebene,
            steuerung
              .bloecke()
              .map((block) => block.ar)
              .filter((pose): pose is { x: number; y: number; z: number } =>
                Boolean(pose),
              ),
          )
          if (zelle) {
            visier.position.set(zelle.x, zelle.y + 0.004, zelle.z)
          } else {
            visier.position.set(p.x, p.y + 0.004, p.z)
          }
        }
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
    buch: 0x5a3a1c,
  }
  return tabelle[name] ?? 0x8b5a2b
}
