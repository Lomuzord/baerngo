import type { Mesh, Scene } from "three"
import { gegenstandById } from "@/lib/gegenstaende"

const cache = new Map<string, unknown>()

export async function materialFuerBlock(
  THREE: typeof import("three"),
  gegenstandId: string,
) {
  const treffer = cache.get(gegenstandId)
  if (treffer) return treffer as InstanceType<typeof THREE.MeshStandardMaterial>

  const url = gegenstandById(gegenstandId)?.textur ?? "/bloecke/erde.png"
  const textur = await new THREE.TextureLoader().loadAsync(url)
  textur.magFilter = THREE.NearestFilter
  textur.minFilter = THREE.NearestFilter
  textur.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshStandardMaterial({
    map: textur,
    roughness: 0.82,
    metalness: 0.04,
    // Texturen mit Löchern (Leiter-Sprossen, Pflanzen) sollen dort
    // durchsichtig sein statt schwarz zu füllen.
    ...(DURCHBROCHEN.has(gegenstandId)
      ? { transparent: true, alphaTest: 0.5 }
      : {}),
  })
  cache.set(gegenstandId, material)
  return material
}

const DURCHBROCHEN = new Set(["leiter", "setzling", "samen", "weizen"])

// Formteile: Stufen und Treppen sind keine vollen Würfel — sie
// bestehen aus Quadern relativ zur Zellenmitte (Anteile der Kante).
const FORMEN: Record<
  string,
  { x: number; y: number; z: number; w: number; h: number; t: number }[]
> = {
  holzstufe: [{ x: 0, y: -0.25, z: 0, w: 0.98, h: 0.49, t: 0.98 }],
  steinstufe: [{ x: 0, y: -0.25, z: 0, w: 0.98, h: 0.49, t: 0.98 }],
  holztreppe: [
    { x: 0, y: -0.25, z: 0, w: 0.98, h: 0.49, t: 0.98 },
    { x: 0, y: 0.245, z: -0.245, w: 0.98, h: 0.49, t: 0.49 },
  ],
  steintreppe: [
    { x: 0, y: -0.25, z: 0, w: 0.98, h: 0.49, t: 0.98 },
    { x: 0, y: 0.245, z: -0.245, w: 0.98, h: 0.49, t: 0.49 },
  ],
  glasscheibe: [{ x: 0, y: 0, z: 0, w: 0.98, h: 0.98, t: 0.14 }],
  tuer: [{ x: 0, y: 0, z: -0.42, w: 0.98, h: 0.98, t: 0.14 }],
  zaun: [
    { x: 0, y: 0, z: 0, w: 0.24, h: 0.98, t: 0.24 },
    { x: 0, y: 0.18, z: 0, w: 0.98, h: 0.14, t: 0.14 },
    { x: 0, y: -0.2, z: 0, w: 0.98, h: 0.14, t: 0.14 },
  ],
  leiter: [{ x: 0, y: 0, z: -0.44, w: 0.98, h: 0.98, t: 0.1 }],
  setzling: [{ x: 0, y: -0.2, z: 0, w: 0.4, h: 0.58, t: 0.4 }],
  samen: [{ x: 0, y: -0.4, z: 0, w: 0.7, h: 0.18, t: 0.7 }],
  weizen: [{ x: 0, y: -0.1, z: 0, w: 0.86, h: 0.78, t: 0.86 }],
}

// Manche Blöcke tragen auf dem Mesh die Textur ihres Grundmaterials —
// das Inventar-Icon zeigt die Form, der 3D-Block das Material.
const MESH_TEXTUR: Record<string, string> = {
  holzstufe: "holz",
  holztreppe: "holz",
  steinstufe: "stein",
  steintreppe: "stein",
  glasscheibe: "glas",
  zaun: "holz",
}

// Kein Cache: die Szenen entsorgen Geometrien beim Entfernen einzelner
// Blöcke — jede Mesh bekommt darum ihre eigene Instanz.
export function geometrieFuerBlock(
  THREE: typeof import("three"),
  gegenstandId: string,
  kante: number,
) {
  const teile = FORMEN[gegenstandId]
  if (!teile) {
    return new THREE.BoxGeometry(kante * 0.98, kante * 0.98, kante * 0.98)
  }
  const quader = teile.map((teil) =>
    new THREE.BoxGeometry(
      kante * teil.w,
      kante * teil.h,
      kante * teil.t,
    ).translate(kante * teil.x, kante * teil.y, kante * teil.z),
  )
  return mergeBoxen(THREE, quader)
}

// Kleiner Merge ohne examples-Import: nicht-indizierte Quader aneinanderhängen
function mergeBoxen(
  THREE: typeof import("three"),
  teile: InstanceType<typeof THREE.BoxGeometry>[],
) {
  if (teile.length === 1) return teile[0]!
  const offen = teile.map((teil) => teil.toNonIndexed())
  const lagen = ["position", "normal", "uv"] as const
  const zusammen = new THREE.BufferGeometry()
  for (const name of lagen) {
    const daten = offen.map(
      (teil) => teil.getAttribute(name) as InstanceType<typeof THREE.BufferAttribute>,
    )
    const groesse = daten[0]!.itemSize
    const gesamt = new Float32Array(
      daten.reduce((summe, lage) => summe + lage.array.length, 0),
    )
    let cursor = 0
    for (const lage of daten) {
      gesamt.set(lage.array as Float32Array, cursor)
      cursor += lage.array.length
    }
    zusammen.setAttribute(name, new THREE.BufferAttribute(gesamt, groesse))
  }
  return zusammen
}

export async function materialienFuerWuerfel(
  THREE: typeof import("three"),
  gegenstandId: string,
) {
  const texturId = MESH_TEXTUR[gegenstandId]
  if (texturId) return materialFuerBlock(THREE, texturId)
  if (gegenstandId !== "gras") return materialFuerBlock(THREE, gegenstandId)
  const [gras, erde] = await Promise.all([
    materialFuerBlock(THREE, "gras"),
    materialFuerBlock(THREE, "erde"),
  ])
  return [erde, erde, gras, erde, erde, erde]
}

export function rissMaterial(
  THREE: typeof import("three"),
  stufe: 1 | 2 | 3,
) {
  const key = `riss-${stufe}`
  const treffer = cache.get(key)
  if (treffer) return treffer as InstanceType<typeof THREE.MeshStandardMaterial>

  const canvas = document.createElement("canvas")
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext("2d")
  if (ctx) {
    ctx.clearRect(0, 0, 16, 16)
    ctx.strokeStyle = `rgba(20, 12, 8, ${0.45 + stufe * 0.18})`
    ctx.lineWidth = 1
    const linien: [number, number, number, number][][] = [
      [
        [3, 1, 6, 8],
        [8, 4, 14, 7],
      ],
      [
        [1, 3, 7, 14],
        [5, 0, 9, 10],
        [10, 5, 15, 12],
      ],
      [
        [0, 2, 6, 15],
        [4, 0, 8, 16],
        [9, 1, 15, 14],
        [2, 8, 14, 11],
      ],
    ]
    for (const [x1, y1, x2, y2] of linien[stufe - 1] ?? []) {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }
  const textur = new THREE.CanvasTexture(canvas)
  textur.magFilter = THREE.NearestFilter
  textur.minFilter = THREE.NearestFilter
  const material = new THREE.MeshStandardMaterial({
    map: textur,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    roughness: 1,
  })
  cache.set(key, material)
  return material
}

export function leereMaterialCache() {
  cache.clear()
}

export function setzeRiss(
  THREE: typeof import("three"),
  szene: Scene,
  mesh: Mesh,
  stufe: 0 | 1 | 2 | 3,
  kante: number,
) {
  const bisher = mesh.userData.riss as Mesh | undefined
  if (stufe === 0) {
    entferneRiss(szene, mesh)
    return
  }
  if (bisher && bisher.userData.stufe === stufe) {
    bisher.position.copy(mesh.position)
    return
  }
  entferneRiss(szene, mesh)
  const overlay = new THREE.Mesh(
    new THREE.BoxGeometry(kante, kante, kante),
    rissMaterial(THREE, stufe),
  )
  overlay.position.copy(mesh.position)
  overlay.userData.stufe = stufe
  mesh.userData.riss = overlay
  szene.add(overlay)
}

export function entferneRiss(szene: Scene, mesh: Mesh) {
  const riss = mesh.userData.riss as Mesh | undefined
  if (!riss) return
  szene.remove(riss)
  riss.geometry.dispose()
  mesh.userData.riss = undefined
}

export function setzeFallZiel(
  mesh: Mesh,
  ziel: { x: number; y: number; z: number },
  startY?: number,
) {
  mesh.userData.zielX = ziel.x
  mesh.userData.zielY = ziel.y
  mesh.userData.zielZ = ziel.z
  if (typeof startY === "number" && startY > ziel.y + 0.01) {
    mesh.position.set(ziel.x, startY, ziel.z)
    return
  }
  if (mesh.position.y > ziel.y + 0.01) {
    mesh.position.x = ziel.x
    mesh.position.z = ziel.z
    return
  }
  mesh.position.set(ziel.x, ziel.y, ziel.z)
}

export function tickFall(mesh: Mesh, dt: number, speed = 1.15) {
  const zielY = mesh.userData.zielY as number | undefined
  if (typeof zielY !== "number") return
  if (mesh.position.y <= zielY + 0.001) {
    mesh.position.y = zielY
    const riss = mesh.userData.riss as Mesh | undefined
    if (riss) riss.position.copy(mesh.position)
    return
  }
  mesh.position.y = Math.max(zielY, mesh.position.y - speed * dt)
  const riss = mesh.userData.riss as Mesh | undefined
  if (riss) riss.position.copy(mesh.position)
}
