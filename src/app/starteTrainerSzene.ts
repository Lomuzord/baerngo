import { kameraFuerKartenblick, passeKameraAn, yawFuerBlick } from "@/lib/szeneKamera"

export type TrainerRichtung = {
  blick?: number
  karte?: number
  pitch?: number
  geht?: boolean
}

export async function starteTrainerSzene(
  el: HTMLElement,
  richtung: () => TrainerRichtung,
): Promise<() => void> {
  const THREE = await import("three")
  const breite = el.clientWidth || 84
  const hoehe = el.clientHeight || 104
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(breite, hoehe)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  el.replaceChildren(renderer.domElement)

  const szene = new THREE.Scene()
  const kamera = new THREE.PerspectiveCamera(28, breite / hoehe, 0.05, 40)
  szene.add(new THREE.AmbientLight(0xffffff, 0.88))
  const sonne = new THREE.DirectionalLight(0xfff4dc, 1.05)
  sonne.position.set(1.4, 3.2, 4.2)
  szene.add(sonne)

  const figur = baueSteveFigur(THREE)
  szene.add(figur)
  passeKameraAn(kamera, figur, {
    padding: 1.22,
    richtung: { x: 0, y: 0.55, z: 1 },
  })
  const distanz = kamera.position.length()

  const armL = figur.getObjectByName("arm-l")
  const armR = figur.getObjectByName("arm-r")
  const beinL = figur.getObjectByName("bein-l")
  const beinR = figur.getObjectByName("bein-r")

  let rahmen = 0
  let rotY = 0
  let weltBlick = 0
  const start = performance.now()
  const tick = (now: number) => {
    const t = (now - start) / 1000
    const { blick, karte = 0, pitch = 58, geht = false } = richtung()
    if (typeof blick === "number") weltBlick = blick
    const ziel = yawFuerBlick(weltBlick)
    rotY += kuerzesterSchritt(rotY, ziel) * 0.38
    figur.rotation.y = rotY
    kameraFuerKartenblick(kamera, distanz, pitch, karte)
    figur.position.y = Math.sin(t * 2.1) * (geht ? 0.03 : 0.008)
    const schritt = geht ? Math.sin(t * 7.2) * 0.45 : 0
    if (armL) armL.rotation.x += (schritt - armL.rotation.x) * 0.2
    if (armR) armR.rotation.x += (-schritt - armR.rotation.x) * 0.2
    if (beinL) beinL.rotation.x += (-schritt * 0.7 - beinL.rotation.x) * 0.2
    if (beinR) beinR.rotation.x += (schritt * 0.7 - beinR.rotation.x) * 0.2
    renderer.render(szene, kamera)
    rahmen = requestAnimationFrame(tick)
  }
  rahmen = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(rahmen)
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
    renderer.dispose()
    renderer.forceContextLoss()
    if (renderer.domElement.parentNode === el) el.replaceChildren()
  }
}

function baueSteveFigur(THREE: typeof import("three")) {
  const u = 0.068
  const figur = new THREE.Group()
  const haut = maleSteveHaut()

  const kopf = new THREE.Group()
  kopf.add(
    kastenHaut(THREE, haut, 8, 8, 8, 0, 28, 0, u, [
      [0, 8, 8, 8],
      [16, 8, 8, 8],
      [8, 0, 8, 8],
      [16, 0, 8, 8],
      [8, 8, 8, 8],
      [24, 8, 8, 8],
    ]),
  )
  kopf.add(
    kastenHaut(
      THREE,
      haut,
      8.5,
      8.5,
      8.5,
      0,
      28,
      0,
      u,
      [
        [32, 8, 8, 8],
        [48, 8, 8, 8],
        [40, 0, 8, 8],
        [48, 0, 8, 8],
        [40, 8, 8, 8],
        [56, 8, 8, 8],
      ],
      true,
    ),
  )
  figur.add(kopf)

  figur.add(
    kastenHaut(THREE, haut, 8, 12, 4, 0, 18, 0, u, [
      [16, 20, 4, 12],
      [28, 20, 4, 12],
      [20, 16, 8, 4],
      [28, 16, 8, 4],
      [20, 20, 8, 12],
      [32, 20, 8, 12],
    ]),
  )

  const armL = new THREE.Group()
  armL.name = "arm-l"
  armL.position.set(-6 * u, 24 * u, 0)
  armL.add(
    kastenHaut(THREE, haut, 4, 12, 4, 0, -6, 0, u, [
      [40, 20, 4, 12],
      [48, 20, 4, 12],
      [44, 16, 4, 4],
      [48, 16, 4, 4],
      [44, 20, 4, 12],
      [52, 20, 4, 12],
    ]),
  )
  figur.add(armL)

  const armR = new THREE.Group()
  armR.name = "arm-r"
  armR.position.set(6 * u, 24 * u, 0)
  armR.add(
    kastenHaut(THREE, haut, 4, 12, 4, 0, -6, 0, u, [
      [40, 20, 4, 12],
      [48, 20, 4, 12],
      [44, 16, 4, 4],
      [48, 16, 4, 4],
      [44, 20, 4, 12],
      [52, 20, 4, 12],
    ]),
  )
  figur.add(armR)

  const beinL = new THREE.Group()
  beinL.name = "bein-l"
  beinL.position.set(-2 * u, 12 * u, 0)
  beinL.add(
    kastenHaut(THREE, haut, 4, 12, 4, 0, -6, 0, u, [
      [0, 20, 4, 12],
      [8, 20, 4, 12],
      [4, 16, 4, 4],
      [8, 16, 4, 4],
      [4, 20, 4, 12],
      [12, 20, 4, 12],
    ]),
  )
  figur.add(beinL)

  const beinR = new THREE.Group()
  beinR.name = "bein-r"
  beinR.position.set(2 * u, 12 * u, 0)
  beinR.add(
    kastenHaut(THREE, haut, 4, 12, 4, 0, -6, 0, u, [
      [0, 20, 4, 12],
      [8, 20, 4, 12],
      [4, 16, 4, 4],
      [8, 16, 4, 4],
      [4, 20, 4, 12],
      [12, 20, 4, 12],
    ]),
  )
  figur.add(beinR)

  return figur
}

function kastenHaut(
  THREE: typeof import("three"),
  haut: HTMLCanvasElement,
  bx: number,
  by: number,
  bz: number,
  x: number,
  y: number,
  z: number,
  u: number,
  uvs: [number, number, number, number][],
  overlay = false,
) {
  const material = uvs.map(([sx, sy, sw, sh]) =>
    hautTeil(THREE, haut, sx, sy, sw, sh, overlay),
  )
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(bx * u, by * u, bz * u),
    material,
  )
  mesh.position.set(x * u, y * u, z * u)
  return mesh
}

function hautTeil(
  THREE: typeof import("three"),
  haut: HTMLCanvasElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  overlay: boolean,
) {
  const canvas = document.createElement("canvas")
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext("2d")
  if (ctx) {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(haut, sx, sy, sw, sh, 0, 0, sw, sh)
  }
  const textur = new THREE.CanvasTexture(canvas)
  textur.magFilter = THREE.NearestFilter
  textur.minFilter = THREE.NearestFilter
  textur.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshStandardMaterial({
    map: textur,
    roughness: 0.84,
    transparent: overlay,
    alphaTest: overlay ? 0.15 : 0,
  })
}

function maleSteveHaut() {
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas
  ctx.imageSmoothingEnabled = false
  const p = (x: number, y: number, w: number, h: number, farbe: string) => {
    ctx.fillStyle = farbe
    ctx.fillRect(x, y, w, h)
  }

  const haar = "#2b190c"
  const haarHell = "#4a3018"
  const haut = "#c6865a"
  const hautDunkel = "#a86b45"
  const braue = "#3a2212"
  const weiss = "#f4f4f4"
  const auge = "#3a4ea8"
  const bart = "#4a2c18"
  const hemd = "#00aaaa"
  const hemdDunkel = "#008b8b"
  const hose = "#3d4ea0"
  const hoseDunkel = "#2c3a7a"
  const schuh = "#6b6b6b"

  p(8, 0, 8, 8, haar)
  p(10, 1, 4, 2, haarHell)
  p(16, 0, 8, 8, haut)
  p(0, 8, 8, 8, haut)
  p(0, 8, 8, 3, haar)
  p(8, 8, 8, 8, haut)
  p(8, 8, 8, 2, haar)
  p(8, 8, 1, 5, haar)
  p(15, 8, 1, 5, haar)
  p(9, 10, 6, 1, braue)
  p(9, 11, 2, 2, weiss)
  p(13, 11, 2, 2, weiss)
  p(10, 12, 1, 1, auge)
  p(13, 12, 1, 1, auge)
  p(11, 13, 2, 1, hautDunkel)
  p(10, 14, 4, 2, bart)
  p(16, 8, 8, 8, haut)
  p(16, 8, 8, 3, haar)
  p(24, 8, 8, 8, haar)
  p(26, 10, 4, 4, haarHell)

  p(40, 0, 8, 8, haar)
  p(42, 1, 4, 2, haarHell)
  p(32, 8, 8, 3, haar)
  p(40, 8, 8, 3, haar)
  p(40, 8, 1, 5, haar)
  p(47, 8, 1, 5, haar)
  p(48, 8, 8, 3, haar)
  p(56, 8, 8, 8, haar)

  p(20, 16, 8, 4, hemd)
  p(28, 16, 8, 4, hemdDunkel)
  p(16, 20, 4, 12, hemd)
  p(20, 20, 8, 12, hemd)
  p(22, 24, 4, 2, hemdDunkel)
  p(28, 20, 4, 12, hemdDunkel)
  p(32, 20, 8, 12, hemdDunkel)

  p(44, 16, 4, 4, hemd)
  p(48, 16, 4, 4, haut)
  p(40, 20, 4, 4, hemd)
  p(40, 24, 4, 8, haut)
  p(44, 20, 4, 4, hemd)
  p(44, 24, 4, 8, haut)
  p(48, 20, 4, 4, hemd)
  p(48, 24, 4, 8, haut)
  p(52, 20, 4, 4, hemdDunkel)
  p(52, 24, 4, 8, hautDunkel)

  p(4, 16, 4, 4, hose)
  p(8, 16, 4, 4, schuh)
  p(0, 20, 4, 10, hose)
  p(0, 30, 4, 2, schuh)
  p(4, 20, 4, 10, hose)
  p(4, 30, 4, 2, schuh)
  p(6, 24, 2, 2, hoseDunkel)
  p(8, 20, 4, 10, hoseDunkel)
  p(8, 30, 4, 2, schuh)
  p(12, 20, 4, 10, hoseDunkel)
  p(12, 30, 4, 2, schuh)

  return canvas
}

function kuerzesterSchritt(von: number, nach: number): number {
  let delta = nach - von
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  return delta
}
