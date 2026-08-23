import type { Mesh, Scene } from "three"
import { gegenstandById } from "@/lib/gegenstaende"

const cache = new Map<string, unknown>()

// ---- Verdeckung (AR-Tiefe) -------------------------------------------
// Alle Block-Materialien teilen sich diese Uniforms. Die AR-Schleife
// füllt sie pro Bild; ist "an" 0, kostet das nichts und ändert nichts.
export const TIEFE_UNIFORMS = {
  tiefeKarte: { value: null as unknown },
  // Bildkoordinaten -> Tiefenbild (kommt so vom Gerät)
  tiefeUv: { value: new Float32Array(16) },
  // Sichtfeld in Pixeln: x, y, Breite, Höhe
  tiefeFeld: { value: new Float32Array([0, 0, 1, 1]) },
  // x: Rohwert -> Meter, y: an/aus
  tiefeWerte: { value: new Float32Array([0.001, 0]) },
}

// Baut den Tiefentest in ein Material ein: Bildpunkte, vor denen etwas
// Echtes steht, werden verworfen.
function verpasseTiefe(material: { onBeforeCompile: unknown }) {
  ;(material as {
    onBeforeCompile: (shader: {
      uniforms: Record<string, unknown>
      vertexShader: string
      fragmentShader: string
    }) => void
  }).onBeforeCompile = (shader) => {
    shader.uniforms.tiefeKarte = TIEFE_UNIFORMS.tiefeKarte
    shader.uniforms.tiefeUv = TIEFE_UNIFORMS.tiefeUv
    shader.uniforms.tiefeFeld = TIEFE_UNIFORMS.tiefeFeld
    shader.uniforms.tiefeWerte = TIEFE_UNIFORMS.tiefeWerte

    shader.vertexShader =
      "varying float vTiefeAbstand;\n" +
      shader.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\n  vTiefeAbstand = -mvPosition.z;",
      )

    shader.fragmentShader =
      `uniform sampler2D tiefeKarte;
uniform mat4 tiefeUv;
uniform vec4 tiefeFeld;
uniform vec2 tiefeWerte;
varying float vTiefeAbstand;
` +
      shader.fragmentShader.replace(
        "void main() {",
        `void main() {
  if (tiefeWerte.y > 0.5) {
    vec2 imBild = (gl_FragCoord.xy - tiefeFeld.xy) / tiefeFeld.zw;
    vec2 tuv = (tiefeUv * vec4(imBild, 0.0, 1.0)).xy;
    if (tuv.x >= 0.0 && tuv.x <= 1.0 && tuv.y >= 0.0 && tuv.y <= 1.0) {
      vec2 roh = texture2D(tiefeKarte, tuv).rg;
      float echt = (roh.r * 255.0 + roh.g * 255.0 * 256.0) * tiefeWerte.x;
      // 0 heisst "nicht gemessen" — dann nichts wegschneiden
      if (echt > 0.05 && echt < vTiefeAbstand - 0.06) discard;
    }
  }`,
      )
  }
}

export async function materialFuerBlock(
  THREE: typeof import("three"),
  gegenstandId: string,
) {
  const treffer = cache.get(gegenstandId)
  if (treffer) return treffer as InstanceType<typeof THREE.MeshStandardMaterial>

  const url =
    VARIANTEN_TEXTUR[gegenstandId] ??
    gegenstandById(gegenstandId)?.textur ??
    "/bloecke/erde.png"
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
  verpasseTiefe(material)
  cache.set(gegenstandId, material)
  return material
}

const DURCHBROCHEN = new Set(["leiter", "setzling", "samen", "weizen"])

// "an"-Zustände von Redstone-Bauteilen — eigene Texturen, aber keine
// eigenen Inventar-Gegenstände.
const VARIANTEN_TEXTUR: Record<string, string> = {
  "redstone-an": "/bloecke/redstone-an.png",
  "hebel-an": "/bloecke/hebel-an.png",
  "redstonelampe-an": "/bloecke/redstonelampe-an.png",
}

// Welche Textur ein Block gerade trägt — stromführende Redstone-Teile
// wechseln auf ihre helle Variante.
export function anzeigeArt(gegenstandId: string, unterStrom: boolean): string {
  if (!unterStrom) return gegenstandId
  if (gegenstandId === "redstone") return "redstone-an"
  if (gegenstandId === "hebel") return "hebel-an"
  if (gegenstandId === "redstonelampe") return "redstonelampe-an"
  return gegenstandId
}

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
  zaun: [
    { x: 0, y: 0, z: 0, w: 0.24, h: 0.98, t: 0.24 },
    { x: 0, y: 0.18, z: 0, w: 0.98, h: 0.14, t: 0.14 },
    { x: 0, y: -0.2, z: 0, w: 0.98, h: 0.14, t: 0.14 },
  ],
  leiter: [{ x: 0, y: 0, z: -0.44, w: 0.98, h: 0.98, t: 0.1 }],
  redstone: [{ x: 0, y: -0.46, z: 0, w: 0.9, h: 0.06, t: 0.9 }],
  teppich: [{ x: 0, y: -0.46, z: 0, w: 0.98, h: 0.08, t: 0.98 }],
  kuchen: [{ x: 0, y: -0.26, z: 0, w: 0.88, h: 0.48, t: 0.88 }],
  bett: [{ x: 0, y: -0.32, z: 0, w: 0.98, h: 0.36, t: 1.9 }],
  bilderrahmen: [{ x: 0, y: 0, z: -0.44, w: 0.9, h: 0.9, t: 0.1 }],
  hebel: [
    { x: 0, y: -0.42, z: 0, w: 0.5, h: 0.14, t: 0.34 },
    { x: 0, y: -0.16, z: 0, w: 0.14, h: 0.44, t: 0.14 },
  ],
  knopf: [{ x: 0, y: -0.38, z: 0, w: 0.42, h: 0.22, t: 0.3 }],
  redstonefackel: [
    { x: 0, y: -0.22, z: 0, w: 0.16, h: 0.55, t: 0.16 },
    { x: 0, y: 0.1, z: 0, w: 0.24, h: 0.22, t: 0.24 },
  ],
  fackel: [
    { x: 0, y: -0.22, z: 0, w: 0.16, h: 0.55, t: 0.16 },
    { x: 0, y: 0.1, z: 0, w: 0.24, h: 0.22, t: 0.24 },
  ],
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

// Türblatt wie in Minecraft: 1 breit, 2 hoch, 3/16 dick — und die
// Angel sitzt am Rand, nicht in der Zellenmitte. Der Ursprung der
// Geometrie IST die Angel, damit sich das Blatt darum dreht.
export const TUER_BREITE = 0.98
export const TUER_DICKE = 0.19

export function tuerGeometrie(
  THREE: typeof import("three"),
  kante: number,
  gespiegelt: boolean,
) {
  const geo = new THREE.BoxGeometry(
    kante * TUER_BREITE,
    kante * 1.96,
    kante * TUER_DICKE,
  )
  // Der Ursprung ist der Angelzapfen an der Blattkante. In der Tiefe
  // bleibt das Blatt mittig — der Versatz zur Zellenvorderkante steckt
  // in der Mesh-Position. Nur so dreht sich die Tür um die Ecke und
  // schwenkt sauber an die Nachbarkante, statt halb in einen Block zu
  // rutschen.
  geo.translate(
    (gespiegelt ? -1 : 1) * kante * (TUER_BREITE / 2),
    kante * 0.5,
    0,
  )
  return geo
}

// Wo der Angelzapfen in der Zelle steht (Versatz zur Zellenmitte)
export function tuerAngelVersatz(
  kante: number,
  gespiegelt: boolean,
): { x: number; z: number } {
  return {
    x: (gespiegelt ? 1 : -1) * kante * (TUER_BREITE / 2),
    z: -kante * 0.4,
  }
}

// Kein Cache: die Szenen entsorgen Geometrien beim Entfernen einzelner
// Blöcke — jede Mesh bekommt darum ihre eigene Instanz.
export function geometrieFuerBlock(
  THREE: typeof import("three"),
  gegenstandId: string,
  kante: number,
) {
  const teile = FORMEN[gegenstandId.replace(/-an$/, "")]
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
