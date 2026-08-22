// Erzeugt Minecraft-artige Voxel-GLBs für die Sehenswürdigkeiten.
// Aufruf: node src/scripts/erzeugeSichtModelle.mjs
// Schreibt nach public/modelle/<id>.glb. Voxel können eine Farbe (Hex)
// ODER eine Blocktextur aus public/bloecke tragen — die Texturen werden
// als Atlas ins GLB eingebettet (NEAREST-Sampling für den Pixel-Look).
import { execSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const ziel = join(wurzel, "public", "modelle")
mkdirSync(ziel, { recursive: true })

// ---------- Textur-Atlas ----------
// Kachel 0 ist reines Weiss (für Farb-Voxel), danach die Blocktexturen.
const ATLAS_BLOECKE = [
  "sandstein",
  "stein",
  "bruchstein",
  "gras",
  "erde",
  "stamm",
  "holz",
  "ziegel",
  "glas",
  "laub",
  "moosstein",
  "sand",
]
const ATLAS_KACHELN = ATLAS_BLOECKE.length + 1

function baueAtlas() {
  const tmp = join(tmpdir(), "baerngo-atlas")
  mkdirSync(tmp, { recursive: true })
  const weiss = join(tmp, "weiss.png")
  const atlas = join(tmp, "atlas.png")
  execSync(`magick -size 16x16 xc:white "${weiss}"`)
  const quellen = [
    weiss,
    ...ATLAS_BLOECKE.map((id) => join(wurzel, "public", "bloecke", `${id}.png`)),
  ]
  execSync(
    `magick ` +
      quellen.map((q) => `"${q}"`).join(" ") +
      ` -background none +append "${atlas}"`,
  )
  // Transparente Texel (z. B. in Glas) auf hellem Blau flach legen und
  // als RGBA speichern — glTF rendert die Kacheln opak.
  execSync(
    `magick "${atlas}" -background "#aac9dd" -alpha remove -define png:color-type=6 "${atlas}"`,
  )
  return readFileSync(atlas)
}

const ATLAS_PNG = baueAtlas()

function kachelFuer(id) {
  const index = ATLAS_BLOECKE.indexOf(id)
  if (index < 0) throw new Error(`Textur ${id} fehlt im Atlas`)
  return index + 1
}

// ---------- Voxelwelt ----------

function neueWelt() {
  return new Map()
}

function schluessel(x, y, z) {
  return `${x},${y},${z}`
}

function setze(welt, x, y, z, farbe) {
  welt.set(schluessel(x, y, z), farbe)
}

function quader(welt, x0, x1, y0, y1, z0, z1, farbe) {
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++) setze(welt, x, y, z, farbe)
}

function entferne(welt, x0, x1, y0, y1, z0, z1) {
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++) welt.delete(schluessel(x, y, z))
}

// ---------- Mesh-Aufbau mit Flächen-Culling ----------

const FLAECHEN = [
  { n: [1, 0, 0], ecken: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], licht: 0.8 },
  { n: [-1, 0, 0], ecken: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], licht: 0.8 },
  { n: [0, 1, 0], ecken: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], licht: 1.0 },
  { n: [0, -1, 0], ecken: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], licht: 0.5 },
  { n: [0, 0, 1], ecken: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], licht: 0.9 },
  { n: [0, 0, -1], ecken: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], licht: 0.65 },
]

// Voxelwert: Hex-Farbe (number), Textur-Id (string) oder
// { textur, hell } für abgedunkelte Texturflächen (z. B. Ecklisenen).
function deuteVoxel(wert) {
  if (typeof wert === "number") {
    return {
      kachel: 0,
      r: ((wert >> 16) & 0xff) / 255,
      g: ((wert >> 8) & 0xff) / 255,
      b: (wert & 0xff) / 255,
    }
  }
  if (typeof wert === "string") {
    return { kachel: kachelFuer(wert), r: 1, g: 1, b: 1 }
  }
  const t = wert.hell ?? 1
  return { kachel: kachelFuer(wert.textur), r: t, g: t, b: t }
}

function baueMesh(welt) {
  const positionen = []
  const normalen = []
  const farben = []
  const uvs = []
  const indizes = []
  let ecke = 0
  // Halbes Texel Einzug gegen Kachel-Ausbluten beim Sampling
  const rand = 0.5 / 16 / ATLAS_KACHELN
  for (const [key, wert] of welt) {
    const [x, y, z] = key.split(",").map(Number)
    const { kachel, r, g, b } = deuteVoxel(wert)
    const u0 = kachel / ATLAS_KACHELN + rand
    const u1 = (kachel + 1) / ATLAS_KACHELN - rand
    const eckenUv = [
      [u0, 1],
      [u0, 0],
      [u1, 0],
      [u1, 1],
    ]
    for (const fl of FLAECHEN) {
      const nachbar = schluessel(x + fl.n[0], y + fl.n[1], z + fl.n[2])
      if (welt.has(nachbar)) continue
      for (let i = 0; i < 4; i++) {
        const [ex, ey, ez] = fl.ecken[i]
        positionen.push(x + ex, y + ey, z + ez)
        normalen.push(fl.n[0], fl.n[1], fl.n[2])
        farben.push(r * fl.licht, g * fl.licht, b * fl.licht)
        uvs.push(eckenUv[i][0], eckenUv[i][1])
      }
      indizes.push(ecke, ecke + 1, ecke + 2, ecke, ecke + 2, ecke + 3)
      ecke += 4
    }
  }
  return { positionen, normalen, farben, uvs, indizes }
}

// ---------- GLB-Schreiber ----------

function schreibeGlb(pfad, mesh, name) {
  const pos = new Float32Array(mesh.positionen)
  const norm = new Float32Array(mesh.normalen)
  const farbe = new Float32Array(mesh.farben)
  const uv = new Float32Array(mesh.uvs)
  const idx = new Uint32Array(mesh.indizes)

  // Modell zentrieren (x/z) und auf den Boden stellen.
  let minX = Infinity, maxX = -Infinity, minY = Infinity
  let minZ = Infinity, maxZ = -Infinity
  for (let i = 0; i < pos.length; i += 3) {
    minX = Math.min(minX, pos[i]); maxX = Math.max(maxX, pos[i])
    minY = Math.min(minY, pos[i + 1])
    minZ = Math.min(minZ, pos[i + 2]); maxZ = Math.max(maxZ, pos[i + 2])
  }
  const mx = (minX + maxX) / 2
  const mz = (minZ + maxZ) / 2
  for (let i = 0; i < pos.length; i += 3) {
    pos[i] -= mx
    pos[i + 1] -= minY
    pos[i + 2] -= mz
  }
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < pos.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], pos[i + a])
      max[a] = Math.max(max[a], pos[i + a])
    }
  }

  // Direkt aus dem Buffer schneiden — new Uint8Array(...) würde bereits
  // bei Offset 0 kopieren und der zweite Offset läge dann daneben.
  const atlas = ATLAS_PNG.buffer.slice(
    ATLAS_PNG.byteOffset,
    ATLAS_PNG.byteOffset + ATLAS_PNG.byteLength,
  )
  const teile = [pos.buffer, norm.buffer, farbe.buffer, uv.buffer, idx.buffer, atlas]
  const laengen = teile.map((buf) => buf.byteLength)
  const versatz = []
  let lauf = 0
  for (const laenge of laengen) {
    versatz.push(lauf)
    lauf += Math.ceil(laenge / 4) * 4
  }
  const bin = new Uint8Array(lauf)
  teile.forEach((buf, i) => bin.set(new Uint8Array(buf), versatz[i]))

  const json = {
    asset: { version: "2.0", generator: "baerngo-voxel" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2, TEXCOORD_0: 3 },
            indices: 4,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [1, 1, 1, 1],
          baseColorTexture: { index: 0 },
          metallicFactor: 0,
          roughnessFactor: 1,
        },
      },
    ],
    // NEAREST-Sampling für den harten Minecraft-Pixel-Look
    samplers: [
      { magFilter: 9728, minFilter: 9728, wrapS: 33071, wrapT: 33071 },
    ],
    textures: [{ sampler: 0, source: 0 }],
    images: [{ bufferView: 5, mimeType: "image/png" }],
    buffers: [{ byteLength: bin.byteLength }],
    bufferViews: teile.map((buf, i) => ({
      buffer: 0,
      byteOffset: versatz[i],
      byteLength: buf.byteLength,
    })),
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: pos.length / 3,
        type: "VEC3",
        min,
        max,
      },
      { bufferView: 1, componentType: 5126, count: norm.length / 3, type: "VEC3" },
      { bufferView: 2, componentType: 5126, count: farbe.length / 3, type: "VEC3" },
      { bufferView: 3, componentType: 5126, count: uv.length / 2, type: "VEC2" },
      { bufferView: 4, componentType: 5125, count: idx.length, type: "SCALAR" },
    ],
  }

  const jsonText = JSON.stringify(json)
  const jsonBytes = new TextEncoder().encode(jsonText)
  const jsonPad = Math.ceil(jsonBytes.byteLength / 4) * 4
  const binPad = Math.ceil(bin.byteLength / 4) * 4
  const gesamt = 12 + 8 + jsonPad + 8 + binPad
  const out = new ArrayBuffer(gesamt)
  const dv = new DataView(out)
  const u8 = new Uint8Array(out)
  dv.setUint32(0, 0x46546c67, true) // "glTF"
  dv.setUint32(4, 2, true)
  dv.setUint32(8, gesamt, true)
  dv.setUint32(12, jsonPad, true)
  dv.setUint32(16, 0x4e4f534a, true) // "JSON"
  u8.set(jsonBytes, 20)
  u8.fill(0x20, 20 + jsonBytes.byteLength, 20 + jsonPad)
  const binStart = 20 + jsonPad
  dv.setUint32(binStart, binPad, true)
  dv.setUint32(binStart + 4, 0x004e4942, true) // "BIN"
  u8.set(bin, binStart + 8)
  writeFileSync(pfad, Buffer.from(out))
}

// ---------- Farben ----------

// Wo eine echte Blocktextur existiert, nutzen wir sie — die Modelle
// sehen damit aus wie aus dem Spiel gebaut. Reine Farben bleiben für
// Details ohne Texturentsprechung (Uhr, Gold, Rosen …).
const SANDSTEIN = "sandstein"
const SANDSTEIN_DUNKEL = { textur: "sandstein", hell: 0.72 }
const STEIN = "stein"
const STEIN_DUNKEL = { textur: "stein", hell: 0.68 }
const DACH_ROT = "ziegel"
const GRUEN = "gras"
const GRUEN_DUNKEL = "laub"
const GOLD = 0xf1c232
const WEISS = 0xf2f2f2
const GRAU_HELL = 0xd7dde2
const GLAS = "glas"
const HOLZ = "stamm"
const ZIFFERBLATT = 0xf4efe2
const FENSTER = 0x3d4c5c
const ROSE_ROT = 0xe0435c
const ROSE_PINK = 0xf06a92
const ROSE_GELB = 0xffe08a
const BACKSTEIN = { textur: "ziegel", hell: 0.88 }

// ---------- Modelle ----------

function zytglogge() {
  const w = neueWelt()
  quader(w, 0, 6, 0, 19, 0, 6, SANDSTEIN)
  // Ecklisenen (dunklere Kanten)
  for (const [x, z] of [[0, 0], [6, 0], [0, 6], [6, 6]]) {
    quader(w, x, x, 0, 19, z, z, SANDSTEIN_DUNKEL)
  }
  // Torbogen quer durch die Gasse
  entferne(w, 2, 4, 0, 4, 0, 6)
  quader(w, 2, 4, 5, 5, 0, 0, SANDSTEIN_DUNKEL)
  quader(w, 2, 4, 5, 5, 6, 6, SANDSTEIN_DUNKEL)
  // Grosse Uhr: goldener Ring, weisses Blatt, dunkler Zeiger
  quader(w, 1, 5, 11, 15, -1, -1, GOLD)
  quader(w, 2, 4, 12, 14, -1, -1, ZIFFERBLATT)
  setze(w, 3, 13, -2, STEIN_DUNKEL)
  setze(w, 3, 14, -2, STEIN_DUNKEL)
  // Astronomische Uhr darunter
  quader(w, 2, 4, 7, 9, -1, -1, GOLD)
  setze(w, 3, 8, -1, GLAS)
  // Glockenstube oben
  for (const x of [1, 3, 5]) setze(w, x, 18, -1 + 0, FENSTER)
  // Käsbissendach mit Überstand und Laterne
  quader(w, -1, 7, 20, 20, -1, 7, DACH_ROT)
  quader(w, 0, 6, 21, 21, 0, 6, DACH_ROT)
  quader(w, 1, 5, 22, 22, 1, 5, DACH_ROT)
  quader(w, 2, 4, 23, 23, 2, 4, DACH_ROT)
  quader(w, 3, 3, 24, 25, 3, 3, SANDSTEIN)
  setze(w, 3, 26, 3, DACH_ROT)
  setze(w, 3, 27, 3, GOLD)
  return w
}

function muenster() {
  const w = neueWelt()
  // Kirchenschiff mit Satteldach
  quader(w, 0, 15, 0, 7, 0, 7, SANDSTEIN)
  quader(w, 0, 15, 8, 8, 0, 7, DACH_ROT)
  quader(w, 0, 15, 9, 9, 1, 6, DACH_ROT)
  quader(w, 0, 15, 10, 10, 2, 5, DACH_ROT)
  quader(w, 0, 15, 11, 11, 3, 4, DACH_ROT)
  // Strebepfeiler und Spitzbogenfenster
  for (let x = 7; x <= 14; x += 2) {
    quader(w, x, x, 0, 6, -1, -1, SANDSTEIN_DUNKEL)
  }
  for (let x = 8; x <= 13; x += 2) {
    quader(w, x, x, 2, 5, 0, 0, FENSTER)
    setze(w, x, 6, -0 + 0, SANDSTEIN_DUNKEL)
  }
  // Hauptportal (Jüngstes Gericht) mit goldenem Bogen
  entferne(w, 2, 4, 0, 3, 0, 0)
  quader(w, 1, 5, 4, 4, -1, -1, GOLD)
  quader(w, 2, 4, 0, 3, 1, 1, FENSTER)
  // Der höchste Kirchturm der Schweiz
  quader(w, 0, 6, 0, 21, 0, 6, SANDSTEIN)
  for (const [x, z] of [[0, 0], [6, 0], [0, 6], [6, 6]]) {
    quader(w, x, x, 8, 21, z, z, SANDSTEIN_DUNKEL)
  }
  // Rosette und Glockenfenster
  quader(w, 2, 4, 9, 11, -1, -1, GOLD)
  setze(w, 3, 10, -1, GLAS)
  for (const x of [1, 3, 5]) quader(w, x, x, 16, 20, -0 + 0, 0, FENSTER)
  // Durchbrochener Spitzhelm
  quader(w, 0, 6, 22, 22, 0, 6, SANDSTEIN_DUNKEL)
  quader(w, 1, 5, 23, 24, 1, 5, SANDSTEIN_DUNKEL)
  quader(w, 2, 4, 25, 27, 2, 4, SANDSTEIN_DUNKEL)
  quader(w, 3, 3, 28, 31, 3, 3, SANDSTEIN_DUNKEL)
  setze(w, 3, 32, 3, GOLD)
  return w
}

function gibb() {
  const w = neueWelt()
  const RAHMEN = 0xd7dde2
  const SILBER = 0xc6ccd2
  const SILBER_DUNKEL = 0x8a9096
  const PYLON = 0x4a5056
  // Campus-Gasse zwischen den beiden Glastrakten
  quader(w, -2, 30, 0, 0, -1, 17, { textur: "stein", hell: 0.88 })

  // Ein Trakt: Glas-Vorhangfassade mit hellen Geschossbändern
  function glasTrakt(x0, x1, z0, z1, hoehe) {
    quader(w, x0, x1, 1, hoehe, z0, z1, GLAS)
    for (let y = 3; y < hoehe; y += 3) {
      quader(w, x0, x1, y, y, z0, z1, RAHMEN)
    }
    // Attika und Eckprofile
    quader(w, x0, x1, hoehe + 1, hoehe + 1, z0, z1, RAHMEN)
    for (const [ex, ez] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
      quader(w, ex, ex, 1, hoehe, ez, ez, WEISS)
    }
  }

  // Linker Trakt (hinten) mit den drei Silber-Kaminen
  glasTrakt(0, 26, 11, 16, 12)
  for (const x of [5, 7, 9]) {
    quader(w, x, x, 13, 17, 13, 13, SILBER)
    setze(w, x, 18, 13, SILBER_DUNKEL)
  }
  // Vordach am Eingang des linken Trakts
  quader(w, 12, 18, 3, 3, 9, 10, RAHMEN)

  // Rechter Trakt (vorne)
  glasTrakt(4, 30, 0, 5, 12)
  // Aussenliegender Glas-Treppenturm an der Ecke — die Läufe
  // schimmern als weisse Stufen durch die Fassade
  quader(w, 4, 9, 1, 14, 0, 5, GLAS)
  quader(w, 4, 9, 15, 15, 0, 5, RAHMEN)
  for (let i = 0; i < 5; i++) {
    quader(w, 5 + i * 0 + i, 5 + i, 2 + i * 2, 2 + i * 2, 0, 0, WEISS)
    quader(w, 8 - i, 8 - i, 3 + i * 2, 3 + i * 2, 0, 0, WEISS)
  }

  // Der graue "g gibb"-Pylon in der Gasse
  quader(w, 13, 13, 1, 6, 7, 7, PYLON)
  setze(w, 13, 5, 6, WEISS)

  // Hecken, Bänke und Bäume entlang der Gasse
  quader(w, 10, 24, 1, 1, 6, 6, GRUEN_DUNKEL)
  quader(w, 6, 10, 1, 1, 10, 10, GRUEN_DUNKEL)
  for (const x of [16, 20]) {
    quader(w, x, x + 1, 1, 1, 9, 9, HOLZ)
  }
  for (const [x, z] of [[2, 8], [27, 8]]) {
    quader(w, x, x, 1, 4, z, z, HOLZ)
    quader(w, x - 1, x + 1, 5, 6, z - 1, z + 1, GRUEN_DUNKEL)
    setze(w, x, 7, z, GRUEN)
  }
  return w
}

function rosengarten() {
  const w = neueWelt()
  quader(w, 0, 14, 0, 0, 0, 14, GRUEN)
  // Kieswege in Kreuzform
  quader(w, 7, 7, 0, 0, 0, 14, SANDSTEIN_DUNKEL)
  quader(w, 0, 14, 0, 0, 7, 7, SANDSTEIN_DUNKEL)
  // Hecken um die Quartiere
  for (const [x0, x1, z0, z1] of [
    [1, 5, 1, 5], [9, 13, 1, 5], [1, 5, 9, 13], [9, 13, 9, 13],
  ]) {
    quader(w, x0, x1, 1, 1, z0, z0, GRUEN_DUNKEL)
    quader(w, x0, x1, 1, 1, z1, z1, GRUEN_DUNKEL)
    quader(w, x0, x0, 1, 1, z0, z1, GRUEN_DUNKEL)
    quader(w, x1, x1, 1, 1, z0, z1, GRUEN_DUNKEL)
  }
  // Rosenbeete in vier Farben
  const rosen = [
    [3, 3, ROSE_ROT], [2, 4, ROSE_PINK], [4, 2, ROSE_GELB],
    [11, 3, ROSE_PINK], [10, 2, ROSE_ROT], [12, 4, WEISS],
    [3, 11, ROSE_GELB], [2, 12, WEISS], [4, 10, ROSE_ROT],
    [11, 11, ROSE_ROT], [12, 10, ROSE_GELB], [10, 12, ROSE_PINK],
  ]
  for (const [x, z, farbe] of rosen) {
    setze(w, x, 1, z, GRUEN_DUNKEL)
    setze(w, x, 2, z, farbe)
  }
  // Pergola mit Kletterrosen am Aussichtsende
  quader(w, 5, 9, 1, 3, 14, 14, HOLZ)
  entferne(w, 6, 8, 1, 2, 14, 14)
  setze(w, 5, 3, 13, GRUEN_DUNKEL)
  setze(w, 9, 3, 13, ROSE_PINK)
  // Parkbank mit Blick auf die Altstadt
  quader(w, 6, 8, 1, 1, 0, 0, HOLZ)
  return w
}

function kaefigturm() {
  const w = neueWelt()
  quader(w, 0, 6, 0, 15, 0, 6, SANDSTEIN)
  for (const [x, z] of [[0, 0], [6, 0], [0, 6], [6, 6]]) {
    quader(w, x, x, 0, 15, z, z, SANDSTEIN_DUNKEL)
  }
  // Tordurchfahrt
  entferne(w, 2, 4, 0, 3, 0, 6)
  quader(w, 2, 4, 4, 4, 0, 0, SANDSTEIN_DUNKEL)
  quader(w, 2, 4, 4, 4, 6, 6, SANDSTEIN_DUNKEL)
  // Uhr mit goldenem Ring
  quader(w, 1, 5, 10, 14, -1, -1, GOLD)
  quader(w, 2, 4, 11, 13, -1, -1, ZIFFERBLATT)
  setze(w, 3, 12, -2, STEIN_DUNKEL)
  // Vergitterte Gefängnisfenster
  for (const x of [1, 3, 5]) setze(w, x, 7, -1, FENSTER)
  setze(w, 1, 8, -1, FENSTER)
  setze(w, 5, 8, -1, FENSTER)
  // Steiles Walmdach mit Überstand, Dachlaterne und Wetterfahne
  quader(w, -1, 7, 16, 16, -1, 7, DACH_ROT)
  quader(w, 0, 6, 17, 17, 0, 6, DACH_ROT)
  quader(w, 1, 5, 18, 18, 1, 5, DACH_ROT)
  quader(w, 2, 4, 19, 19, 2, 4, DACH_ROT)
  quader(w, 3, 3, 20, 21, 3, 3, SANDSTEIN)
  setze(w, 3, 22, 3, DACH_ROT)
  setze(w, 3, 23, 3, GOLD)
  return w
}

function einsteinhaus() {
  const w = neueWelt()
  quader(w, 0, 4, 0, 8, 0, 3, SANDSTEIN)
  // Berner Lauben: tiefe Arkade mit Pfeilern
  entferne(w, 0, 4, 0, 1, -1, 0)
  quader(w, 0, 0, 0, 1, -1, -1, SANDSTEIN_DUNKEL)
  quader(w, 2, 2, 0, 1, -1, -1, SANDSTEIN_DUNKEL)
  quader(w, 4, 4, 0, 1, -1, -1, SANDSTEIN_DUNKEL)
  quader(w, 0, 4, 2, 2, -1, -1, SANDSTEIN)
  // Fensterreihen, vertieft in der Fassade
  for (const y of [4, 6]) {
    setze(w, 1, y, -1, FENSTER)
    setze(w, 3, y, -1, FENSTER)
  }
  // Rote Fensterläden bei Einsteins Wohnung im 2. Stock
  setze(w, 0, 4, -1, DACH_ROT)
  setze(w, 4, 4, -1, DACH_ROT)
  // Giebeldach mit Überstand
  quader(w, -1, 5, 9, 9, -1, 4, STEIN_DUNKEL)
  quader(w, 0, 4, 10, 10, 0, 3, STEIN_DUNKEL)
  quader(w, 1, 3, 11, 11, 1, 2, STEIN_DUNKEL)
  // Dachgaube
  setze(w, 2, 10, -1 + 1, FENSTER)
  return w
}

function zentrumPaulKlee() {
  const w = neueWelt()
  quader(w, 0, 38, 0, 0, 0, 9, GRUEN)
  // Breitere Wellen = sanftere Stufen, ganz ohne Rippen
  const wellen = [
    { start: 0, breite: 12, hoehe: 6 },
    { start: 12, breite: 14, hoehe: 8 },
    { start: 26, breite: 12, hoehe: 5 },
  ]
  for (const welle of wellen) {
    for (let i = 0; i <= welle.breite; i++) {
      const t = i / welle.breite
      const h = Math.max(1, Math.round(Math.sin(t * Math.PI) * welle.hoehe))
      const x = welle.start + i
      // Massive weisse Welle, Glasfront zum Betrachter hin
      quader(w, x, x, 1, h, 1, 8, WEISS)
      quader(w, x, x, 1, Math.max(1, h - 1), 0, 0, GLAS)
    }
  }
  // Eingang in der Mittelwelle und die "Museumsstrasse"
  entferne(w, 17, 21, 1, 2, 0, 0)
  quader(w, 17, 21, 1, 2, 1, 1, FENSTER)
  quader(w, 0, 38, 0, 0, 9, 9, SANDSTEIN_DUNKEL)
  return w
}

function gurten() {
  const w = neueWelt()
  // Gestufter grüner Hügel
  quader(w, 0, 16, 0, 0, 0, 16, GRUEN)
  quader(w, 1, 15, 1, 1, 1, 15, GRUEN)
  quader(w, 2, 14, 2, 2, 2, 14, GRUEN_DUNKEL)
  quader(w, 3, 13, 3, 3, 3, 13, GRUEN)
  quader(w, 4, 12, 4, 4, 4, 12, GRUEN_DUNKEL)
  quader(w, 5, 11, 5, 5, 5, 11, GRUEN)
  // Gurtenbahn: Trasse mit zwei roten Wagen
  for (let i = 0; i <= 5; i++) {
    quader(w, 8, 8, i, i, 16 - i * 2, 16 - i * 2, HOLZ)
    quader(w, 8, 8, i, i, 15 - i * 2, 15 - i * 2, HOLZ)
  }
  quader(w, 8, 8, 2, 3, 11, 12, DACH_ROT)
  quader(w, 8, 8, 4, 5, 7, 8, DACH_ROT)
  // Bäume am Hang
  for (const [x, z] of [[3, 5], [13, 4], [4, 12], [12, 12]]) {
    setze(w, x, 1 + hoeheBei(x, z), z, HOLZ)
    quader(w, x - 1, x + 1, 2 + hoeheBei(x, z), 3 + hoeheBei(x, z), z - 1, z + 1, GRUEN_DUNKEL)
  }
  // Aussichtsturm auf der Kuppe
  quader(w, 8, 8, 6, 12, 8, 8, STEIN)
  quader(w, 7, 9, 12, 12, 7, 9, STEIN_DUNKEL)
  quader(w, 7, 9, 13, 13, 7, 9, DACH_ROT)
  setze(w, 8, 14, 8, GOLD)
  return w

  function hoeheBei(x, z) {
    const rand = Math.min(x, z, 16 - x, 16 - z)
    return Math.min(5, Math.max(0, rand))
  }
}

function kunstmuseum() {
  const w = neueWelt()
  // Sockelgeschoss mit Freitreppe
  quader(w, -1, 13, 0, 0, -2, 6, SANDSTEIN_DUNKEL)
  quader(w, 0, 12, 0, 7, 0, 6, SANDSTEIN)
  quader(w, 2, 10, 1, 1, -1, -1, SANDSTEIN_DUNKEL)
  // Säulenfront mit Kapitellen
  for (let x = 1; x <= 11; x += 2) {
    quader(w, x, x, 1, 5, -1, -1, WEISS)
    setze(w, x, 6, -1, SANDSTEIN_DUNKEL)
  }
  // Gebälk und Gesims
  quader(w, -1, 13, 7, 7, -2, 6, SANDSTEIN_DUNKEL)
  // Fenster der Seitenflügel
  for (const z of [1, 3, 5]) {
    setze(w, 0, 3, z - 1 + 1, FENSTER)
    setze(w, 12, 3, z, FENSTER)
  }
  // Giebeldreieck mit goldenem Relief
  quader(w, 1, 11, 8, 8, 0, 6, SANDSTEIN)
  quader(w, 3, 9, 9, 9, 0, 6, SANDSTEIN)
  quader(w, 5, 7, 10, 10, 0, 6, SANDSTEIN)
  setze(w, 6, 8, -1, GOLD)
  // Portal
  entferne(w, 5, 7, 1, 3, 0, 0)
  quader(w, 5, 7, 1, 3, 1, 1, FENSTER)
  return w
}

function nydeggkirche() {
  const w = neueWelt()
  // Kirchenschiff mit steilem Satteldach
  quader(w, 0, 9, 0, 4, 0, 4, SANDSTEIN)
  quader(w, 0, 9, 5, 5, 0, 4, DACH_ROT)
  quader(w, 0, 9, 6, 6, 1, 3, DACH_ROT)
  quader(w, 0, 9, 7, 7, 2, 2, DACH_ROT)
  // Spitzbogenfenster
  for (const x of [1, 3, 5, 7]) {
    setze(w, x, 2, -1 + 1 - 1, FENSTER)
    setze(w, x, 3, -0, FENSTER)
  }
  // Turm mit spitzem Helm
  quader(w, 0, 2, 0, 10, 0, 2, SANDSTEIN)
  setze(w, 1, 8, -1 + 0, ZIFFERBLATT)
  quader(w, 0, 2, 11, 11, 0, 2, SANDSTEIN_DUNKEL)
  setze(w, 1, 12, 1, DACH_ROT)
  setze(w, 1, 13, 1, DACH_ROT)
  setze(w, 1, 14, 1, GOLD)
  return w
}

function botanischerGarten() {
  const w = neueWelt()
  quader(w, 0, 12, 0, 0, 0, 8, GRUEN)
  // Gewächshaus aus Glas mit Tonnendach
  quader(w, 1, 6, 1, 3, 1, 5, GLAS)
  quader(w, 2, 5, 4, 4, 2, 4, GLAS)
  quader(w, 3, 4, 5, 5, 3, 3, WEISS)
  // Beete mit Pflanzen
  const beete = [
    [9, 2, ROSE_ROT], [11, 2, ROSE_GELB], [9, 4, GRUEN_DUNKEL],
    [11, 4, ROSE_PINK], [9, 6, ROSE_GELB], [11, 6, GRUEN_DUNKEL],
  ]
  for (const [x, z, farbe] of beete) {
    setze(w, x, 1, z, GRUEN_DUNKEL)
    setze(w, x, 2, z, farbe)
  }
  // Ein Baum
  quader(w, 2, 2, 1, 3, 7, 7, HOLZ)
  quader(w, 1, 3, 4, 5, 6, 8, GRUEN_DUNKEL)
  setze(w, 2, 6, 7, GRUEN)
  return w
}

function heiliggeistkirche() {
  const w = neueWelt()
  // Barockes Kirchenschiff mit Walmdach
  quader(w, 0, 11, 0, 6, 0, 6, SANDSTEIN)
  quader(w, 0, 11, 7, 7, 0, 6, DACH_ROT)
  quader(w, 0, 11, 8, 8, 1, 5, DACH_ROT)
  quader(w, 0, 11, 9, 9, 2, 4, DACH_ROT)
  // Rundbogenfenster in zwei Reihen (Barock)
  for (let x = 5; x <= 10; x += 2) {
    setze(w, x, 2, -0 + 0, FENSTER)
    setze(w, x, 5, -0 + 0, FENSTER)
  }
  // Turm mit Uhr und geschweifter Haube
  quader(w, 0, 4, 0, 13, 0, 4, SANDSTEIN)
  quader(w, 1, 3, 10, 12, -1, -1, ZIFFERBLATT)
  setze(w, 2, 11, -2, STEIN_DUNKEL)
  quader(w, -1, 5, 14, 14, -1, 5, SANDSTEIN_DUNKEL)
  quader(w, 0, 4, 15, 15, 0, 4, DACH_ROT)
  quader(w, 1, 3, 16, 16, 1, 3, DACH_ROT)
  quader(w, 2, 2, 17, 18, 2, 2, SANDSTEIN)
  setze(w, 2, 19, 2, DACH_ROT)
  setze(w, 2, 20, 2, GOLD)
  // Portal
  entferne(w, 1, 3, 0, 2, 0, 0)
  quader(w, 1, 3, 0, 2, 1, 1, FENSTER)
  return w
}

function franzoesischeKirche() {
  const w = neueWelt()
  // Gotische Halle — Berns älteste Kirche
  quader(w, 0, 10, 0, 6, 0, 5, SANDSTEIN)
  quader(w, 0, 10, 7, 7, 0, 5, DACH_ROT)
  quader(w, 0, 10, 8, 8, 1, 4, DACH_ROT)
  quader(w, 0, 10, 9, 9, 2, 3, DACH_ROT)
  // Hohe Spitzbogenfenster
  for (let x = 1; x <= 9; x += 2) {
    quader(w, x, x, 2, 5, 0, 0, FENSTER)
  }
  // Dachreiter statt grossem Turm
  quader(w, 4, 6, 10, 11, 2, 3, SANDSTEIN)
  quader(w, 4, 6, 12, 12, 2, 3, DACH_ROT)
  setze(w, 5, 13, 2, DACH_ROT)
  setze(w, 5, 14, 2, GOLD)
  // Predigerportal
  entferne(w, 4, 6, 0, 2, 0, 0)
  quader(w, 4, 6, 0, 2, 1, 1, FENSTER)
  return w
}

function tierpark() {
  const w = neueWelt()
  const BAER_BRAUN = 0x6d4a2f
  quader(w, 0, 14, 0, 0, 0, 10, GRUEN)
  // Holzzaun ums Gehege
  for (let x = 1; x <= 9; x++) {
    setze(w, x, 1, 1, HOLZ)
    setze(w, x, 1, 7, HOLZ)
  }
  for (let z = 1; z <= 7; z++) {
    setze(w, 1, 1, z, HOLZ)
    setze(w, 9, 1, z, HOLZ)
  }
  entferne(w, 5, 5, 1, 1, 7, 7)
  // Ein Bär im Gehege
  quader(w, 4, 6, 1, 2, 3, 4, BAER_BRAUN)
  setze(w, 7, 2, 4, BAER_BRAUN)
  setze(w, 7, 3, 4, BAER_BRAUN)
  // Teich
  quader(w, 2, 3, 0, 0, 5, 6, GLAS)
  // Bäume des Dählhölzliwalds
  for (const [x, z] of [[12, 2], [11, 7], [13, 5]]) {
    quader(w, x, x, 1, 3, z, z, HOLZ)
    quader(w, x - 1, x + 1, 4, 5, z - 1, z + 1, GRUEN_DUNKEL)
    setze(w, x, 6, z, GRUEN)
  }
  // Eingangshäuschen
  quader(w, 0, 2, 1, 3, 9, 10, HOLZ)
  quader(w, -1, 3, 4, 4, 8, 10, DACH_ROT)
  entferne(w, 1, 1, 1, 2, 9, 9)
  return w
}

function kornhaus() {
  const w = neueWelt()
  // Barockes Kornhaus: Sandsteinbau mit Laubenbögen und Mansarddach
  quader(w, 0, 13, 0, 7, 0, 6, SANDSTEIN)
  // Lauben-Arkade im Erdgeschoss
  for (let x = 1; x <= 12; x += 2) {
    entferne(w, x, x, 0, 2, 0, 0)
    quader(w, x, x, 0, 2, 1, 1, { textur: "sandstein", hell: 0.65 })
  }
  // Fensterreihen
  for (const y of [4, 6]) {
    for (let x = 1; x <= 12; x += 2) {
      setze(w, x, y, -1, FENSTER)
    }
  }
  // Mächtiges Mansarddach
  quader(w, -1, 14, 8, 9, -1, 7, STEIN_DUNKEL)
  quader(w, 0, 13, 10, 11, 0, 6, STEIN_DUNKEL)
  quader(w, 1, 12, 12, 12, 1, 5, STEIN_DUNKEL)
  // Gauben
  for (const x of [3, 7, 11]) {
    quader(w, x, x, 8, 9, -2, -2, SANDSTEIN)
    setze(w, x, 8, -3 + 1, GLAS)
  }
  return w
}

function naturhistorisches() {
  const w = neueWelt()
  quader(w, -2, 13, 0, 0, -3, 5, { textur: "stein", hell: 0.85 })
  // Museumsbau mit Säulenfront
  quader(w, 0, 11, 0, 7, 0, 5, SANDSTEIN)
  for (let x = 2; x <= 9; x += 2) {
    quader(w, x, x, 1, 5, -1, -1, WEISS)
  }
  quader(w, 0, 11, 6, 6, -1, 5, { textur: "sandstein", hell: 0.8 })
  quader(w, 0, 11, 8, 8, 0, 5, STEIN_DUNKEL)
  quader(w, 1, 10, 9, 9, 1, 4, STEIN_DUNKEL)
  entferne(w, 5, 6, 0, 2, 0, 0)
  quader(w, 5, 6, 0, 2, 1, 1, FENSTER)
  // Barry, der berühmteste Bernhardiner, vor dem Eingang
  const BARRY = 0x9c7248
  quader(w, 13, 14, 1, 1, -2, -1, BARRY)
  setze(w, 15, 1, -1, BARRY)
  setze(w, 15, 2, -1, BARRY)
  setze(w, 15, 2, -2, 0xf2f2f2)
  return w
}

function universitaet() {
  const w = neueWelt()
  // Hauptgebäude auf der Grossen Schanze: Palast mit Mittelturm
  quader(w, 0, 19, 0, 6, 0, 5, SANDSTEIN)
  for (const y of [2, 5]) {
    for (let x = 1; x <= 18; x += 2) {
      setze(w, x, y, -1, FENSTER)
    }
  }
  // Seitenrisalite
  quader(w, 0, 2, 0, 8, -1, 5, { textur: "sandstein", hell: 0.85 })
  quader(w, 17, 19, 0, 8, -1, 5, { textur: "sandstein", hell: 0.85 })
  quader(w, -1, 3, 9, 9, -1, 5, STEIN_DUNKEL)
  quader(w, 16, 20, 9, 9, -1, 5, STEIN_DUNKEL)
  // Mittelturm mit Kuppel
  quader(w, 8, 11, 0, 11, 0, 5, SANDSTEIN)
  quader(w, 8, 11, 7, 10, -1, -1, { textur: "sandstein", hell: 0.94 })
  setze(w, 9, 8, -2, ZIFFERBLATT)
  setze(w, 10, 8, -2, ZIFFERBLATT)
  quader(w, 7, 12, 12, 12, -1, 5, STEIN_DUNKEL)
  quader(w, 8, 11, 13, 13, 0, 4, GRAU_HELL)
  quader(w, 9, 10, 14, 14, 1, 3, GRAU_HELL)
  setze(w, 9, 15, 2, GOLD)
  // Dach des Haupttrakts
  quader(w, 3, 16, 7, 7, 0, 5, STEIN_DUNKEL)
  quader(w, 4, 15, 8, 8, 1, 4, STEIN_DUNKEL)
  // Eingang mit Freitreppe
  entferne(w, 9, 10, 0, 2, 0, 0)
  quader(w, 9, 10, 0, 2, 1, 1, FENSTER)
  quader(w, 8, 11, 0, 0, -2, -1, { textur: "stein", hell: 0.75 })
  return w
}

function bundeshaus() {
  const w = neueWelt()
  const KUPPEL = 0x6fa287
  // Mitteltrakt
  quader(w, 8, 18, 0, 9, 0, 6, SANDSTEIN)
  // Flügelbauten
  quader(w, 0, 7, 0, 7, 0, 5, SANDSTEIN)
  quader(w, 19, 26, 0, 7, 0, 5, SANDSTEIN)
  quader(w, -1, 8, 8, 8, -1, 6, STEIN_DUNKEL)
  quader(w, 18, 27, 8, 8, -1, 6, STEIN_DUNKEL)
  // Arkaden der Flügel
  for (const x0 of [1, 20]) {
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * 2
      entferne(w, x, x, 0, 1, 0, 0)
      quader(w, x, x, 0, 1, 1, 1, { textur: "sandstein", hell: 0.68 })
    }
    for (let i = 0; i < 3; i++) {
      setze(w, x0 + i * 2, 4, -1, FENSTER)
      setze(w, x0 + i * 2, 6, -1, FENSTER)
    }
  }
  // Die drei Bögen des Hauptportals
  for (const x of [11, 13, 15]) {
    entferne(w, x, x, 0, 2, 0, 0)
    quader(w, x, x, 0, 2, 1, 1, { textur: "sandstein", hell: 0.68 })
  }
  quader(w, 9, 17, 4, 6, -1, -1, { textur: "sandstein", hell: 0.94 })
  for (const x of [10, 12, 14, 16]) setze(w, x, 5, -2, FENSTER)
  // Giebel über dem Mitteltrakt
  quader(w, 8, 18, 10, 10, 0, 6, STEIN_DUNKEL)
  quader(w, 10, 16, 11, 11, 1, 5, SANDSTEIN)
  // Die grosse Patina-Kuppel
  quader(w, 10, 16, 12, 12, 1, 5, KUPPEL)
  quader(w, 11, 15, 13, 13, 1, 5, KUPPEL)
  quader(w, 11, 15, 14, 14, 2, 4, KUPPEL)
  quader(w, 12, 14, 15, 15, 2, 4, KUPPEL)
  quader(w, 13, 13, 16, 16, 3, 3, KUPPEL)
  setze(w, 13, 17, 3, GOLD)
  // Ecktürmchen der Flügel
  for (const x of [0, 26]) {
    quader(w, x, x, 8, 10, 0, 0, SANDSTEIN)
    setze(w, x, 11, 0, KUPPEL)
  }
  // Schweizer Fahne
  quader(w, 13, 13, 18, 20, 3, 3, { textur: "stein", hell: 0.6 })
  setze(w, 12, 20, 3, 0xc8392b)
  return w
}

function baerengraben() {
  const w = neueWelt()
  const BAER = 0x6d4a2f
  const BAER_HELL = 0x8a6238
  const WASSER = 0x4a7c9b
  // Terrassierter Park hinunter zur Aare
  quader(w, 0, 16, 0, 0, 0, 12, GRUEN)
  quader(w, 0, 16, 1, 1, 4, 12, GRUEN)
  quader(w, 0, 16, 2, 2, 8, 12, GRUEN_DUNKEL)
  // Die Aare am unteren Rand
  quader(w, 0, 16, 0, 0, 0, 1, WASSER)
  // Bruchstein-Mauern des alten Grabens
  quader(w, 0, 16, 1, 2, 3, 3, "bruchstein")
  quader(w, 0, 0, 1, 2, 3, 12, "bruchstein")
  quader(w, 16, 16, 1, 2, 3, 12, "bruchstein")
  // Grossbär auf der Wiese
  quader(w, 6, 9, 3, 4, 9, 10, BAER)
  quader(w, 10, 11, 4, 5, 9, 10, BAER)
  setze(w, 11, 5, 9, BAER_HELL)
  setze(w, 10, 6, 9, BAER)
  setze(w, 10, 6, 10, BAER)
  for (const [x, z] of [[6, 9], [6, 10], [9, 9], [9, 10]]) {
    setze(w, x, 2 + 1 - 1 + 1 - 1, z, BAER)
  }
  // Jungbär
  quader(w, 3, 4, 3, 3, 6, 6, BAER_HELL)
  setze(w, 5, 4, 6, BAER_HELL)
  // Baum und Kletterstamm
  quader(w, 13, 13, 3, 5, 6, 6, HOLZ)
  quader(w, 12, 14, 6, 7, 5, 7, GRUEN_DUNKEL)
  quader(w, 3, 3, 3, 5, 10, 10, HOLZ)
  return w
}

// ---------- Ausgabe ----------

const MODELLE = {
  zytglogge,
  muenster,
  gibb,
  rosengarten,
  kaefigturm,
  einsteinhaus,
  "zentrum-paul-klee": zentrumPaulKlee,
  gurten,
  kunstmuseum,
  nydeggkirche,
  "botanischer-garten": botanischerGarten,
  heiliggeistkirche,
  "franzoesische-kirche": franzoesischeKirche,
  tierpark,
  kornhaus,
  "naturhistorisches-museum": naturhistorisches,
  universitaet,
  bundeshaus,
  baerengraben,
}

for (const [id, bau] of Object.entries(MODELLE)) {
  const welt = bau()
  const mesh = baueMesh(welt)
  const pfad = join(ziel, `${id}.glb`)
  schreibeGlb(pfad, mesh, id)
  console.log(
    `${id}.glb — ${welt.size} Voxel, ${mesh.indizes.length / 3} Dreiecke`,
  )
}

// ---------- Marker-Sprites (Software-Renderer, kein WebGL) ----------
// Rendert jedes Modell in 4 Himmelsrichtungen als PNG für die
// Kartenmarker — zur Laufzeit gibt es dann NULL Snapshot-Rendering.

const SPRITE_ZIEL = join(wurzel, "public", "marker")
mkdirSync(SPRITE_ZIEL, { recursive: true })

// Kachel-Pixel als RGBA laden (über magick nach raw konvertiert)
const KACHEL_PIXEL = new Map()
{
  const tmp = join(tmpdir(), "baerngo-atlas")
  for (const id of ATLAS_BLOECKE) {
    const roh = join(tmp, `${id}.rgba`)
    execSync(
      `magick "${join(wurzel, "public", "bloecke", `${id}.png`)}" ` +
        `-background "#aac9dd" -alpha remove -depth 8 rgba:"${roh}"`,
    )
    KACHEL_PIXEL.set(id, readFileSync(roh))
  }
}

function texel(id, u, v) {
  const daten = KACHEL_PIXEL.get(id)
  const x = Math.min(15, Math.max(0, Math.floor(u * 16)))
  const y = Math.min(15, Math.max(0, Math.floor(v * 16)))
  const i = (y * 16 + x) * 4
  return [daten[i], daten[i + 1], daten[i + 2]]
}

function voxelFarbe(wert, u, v) {
  if (typeof wert === "number") {
    return [(wert >> 16) & 0xff, (wert >> 8) & 0xff, wert & 0xff]
  }
  if (typeof wert === "string") return texel(wert, u, v)
  const [r, g, b] = texel(wert.textur, u, v)
  const t = wert.hell ?? 1
  return [r * t, g * t, b * t]
}

// Klassische 2:1-Isometrie, Kante E Pixel. Flächen-Schablonen einmal
// vorberechnen: Liste von (dx, dy, u, v) pro Fläche.
function baueSchablonen(E) {
  const oben = []
  const links = []
  const rechts = []
  // Oben: Raute aus (0,0)->(E,E/2)->(0,E)->(-E,E/2)
  for (let a = 0; a < E; a++) {
    for (let b = 0; b < E; b++) {
      const u = (a + 0.5) / E
      const v = (b + 0.5) / E
      const ox = Math.round((u - v) * E)
      const oy = Math.round(((u + v) * E) / 2)
      oben.push([ox, oy, u, v])
      // Links: x = -E..0, schräg nach unten
      links.push([
        Math.round(-E + u * E),
        Math.round(E / 2 + (u * E) / 2 + v * E),
        u,
        v,
      ])
      // Rechts
      rechts.push([
        Math.round(u * E),
        Math.round(E - (u * E) / 2 + v * E),
        u,
        v,
      ])
    }
  }
  return { oben, links, rechts }
}

function dreheWelt(welt, mal) {
  let aktuell = welt
  for (let n = 0; n < mal; n++) {
    const neu = new Map()
    let maxX = -Infinity
    for (const key of aktuell.keys()) {
      const [x] = key.split(",").map(Number)
      if (x > maxX) maxX = x
    }
    for (const [key, wert] of aktuell) {
      const [x, y, z] = key.split(",").map(Number)
      neu.set(`${z},${y},${maxX - x}`, wert)
    }
    aktuell = neu
  }
  return aktuell
}

function renderSprite(welt, pfad) {
  const E = 8
  const { oben, links, rechts } = baueSchablonen(E)
  const eintraege = []
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  let minZ = Infinity, maxZ = -Infinity
  for (const [key, wert] of welt) {
    const [x, y, z] = key.split(",").map(Number)
    eintraege.push([x, y, z, wert])
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z)
  }
  // Maler-Reihenfolge: hinten zuerst
  eintraege.sort((a, b) => a[0] + a[2] - (b[0] + b[2]) || a[1] - b[1])

  const breite = (maxX - minX + maxZ - minZ + 2) * E + 4
  const hoehe =
    ((maxX - minX + maxZ - minZ + 2) * E) / 2 + (maxY - minY + 1) * E + 4
  const bild = new Uint8ClampedArray(breite * hoehe * 4)

  function male(bx, by, schablone, farbe, licht) {
    const [r, g, b] = farbe
    for (const [dx, dy, u, v] of schablone) {
      void u
      void v
      const px = bx + dx
      const py = by + dy
      if (px < 0 || py < 0 || px >= breite || py >= hoehe) continue
      const i = (py * breite + px) * 4
      bild[i] = r * licht
      bild[i + 1] = g * licht
      bild[i + 2] = b * licht
      bild[i + 3] = 255
    }
  }

  function maleTextur(bx, by, schablone, wert, licht) {
    for (const [dx, dy, u, v] of schablone) {
      const px = bx + dx
      const py = by + dy
      if (px < 0 || py < 0 || px >= breite || py >= hoehe) continue
      const [r, g, b] = voxelFarbe(wert, u, v)
      const i = (py * breite + px) * 4
      bild[i] = r * licht
      bild[i + 1] = g * licht
      bild[i + 2] = b * licht
      bild[i + 3] = 255
    }
  }

  for (const [x, y, z, wert] of eintraege) {
    const rx = x - minX
    const ry = y - minY
    const rz = z - minZ
    const bx = 2 + (rx - rz + (maxZ - minZ)) * E + E
    const by = Math.round(
      2 + ((rx + rz) * E) / 2 + (maxY - minY - ry) * E,
    )
    const textur = typeof wert !== "number"
    const zeichne = textur ? maleTextur : male
    const farbe = textur ? wert : voxelFarbe(wert, 0, 0)
    // Nur sichtbare Flächen (Nachbar-Culling in gedrehter Welt)
    if (!welt.has(`${x},${y + 1},${z}`)) zeichne(bx, by - E, oben, farbe, 1.0)
    if (!welt.has(`${x},${y},${z + 1}`)) zeichne(bx, by - E, links, farbe, 0.72)
    if (!welt.has(`${x + 1},${y},${z}`)) zeichne(bx, by - E, rechts, farbe, 0.86)
  }

  const roh = join(tmpdir(), "baerngo-atlas", "sprite.rgba")
  writeFileSync(roh, Buffer.from(bild.buffer))
  execSync(
    `magick -size ${breite}x${hoehe} -depth 8 rgba:"${roh}" -trim +repage "${pfad}"`,
  )
}

for (const [id, bau] of Object.entries(MODELLE)) {
  for (let richtung = 0; richtung < 4; richtung++) {
    const welt = dreheWelt(bau(), richtung)
    renderSprite(welt, join(SPRITE_ZIEL, `${id}-${richtung}.png`))
  }
  console.log(`${id}: 4 Marker-Sprites`)
}
