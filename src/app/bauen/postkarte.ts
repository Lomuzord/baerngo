// Postkarte: Schnappschuss der Bau-Szene (in AR mit echtem Kamerabild
// dahinter) in einem Berner Rahmen — mit wählbarem Stil und Gruss.

export type SzenenFoto = {
  // Virtuelle Szene (Blöcke); in AR mit transparentem Hintergrund
  vordergrund: string
  // Echtes Kamerabild aus der AR-Sitzung, wenn das Gerät es hergibt
  hintergrund?: string
}

export type PostkartenStil = "klassisch" | "bern" | "nacht"

export type PostkartenOptionen = {
  gruss: string
  stil: PostkartenStil
}

export const POSTKARTEN_STILE: { id: PostkartenStil; name: string }[] = [
  { id: "klassisch", name: "Klassisch" },
  { id: "bern", name: "Bärn" },
  { id: "nacht", name: "Nacht" },
]

const STIL_FARBEN: Record<
  PostkartenStil,
  { papier: string; rand: string; text: string; neben: string; himmel: [string, string] }
> = {
  klassisch: {
    papier: "#f7f2e2",
    rand: "#4a3a28",
    text: "#2b2118",
    neben: "#6b5a40",
    himmel: ["#7ec8e3", "#cfe9f5"],
  },
  bern: {
    papier: "#d5372c",
    rand: "#1a140f",
    text: "#fff8dc",
    neben: "#ffd9b8",
    himmel: ["#f1c232", "#f7e2b0"],
  },
  nacht: {
    papier: "#1c2340",
    rand: "#f1c232",
    text: "#ffe9c7",
    neben: "#9aa7d8",
    himmel: ["#0a1440", "#2b3a70"],
  },
}

// Zeichnet die Karte in ein beliebiges Canvas — auch für die
// Live-Vorschau im Dialog.
export async function zeichnePostkarte(
  karte: HTMLCanvasElement,
  foto: SzenenFoto,
  optionen: PostkartenOptionen,
): Promise<void> {
  const farben = STIL_FARBEN[optionen.stil]
  const breite = 1200
  const hoehe = 860
  karte.width = breite
  karte.height = hoehe
  const ctx = karte.getContext("2d")
  if (!ctx) return

  ctx.fillStyle = farben.papier
  ctx.fillRect(0, 0, breite, hoehe)

  const rand = 46
  const flaecheB = breite - rand * 2
  const flaecheH = hoehe - rand * 2 - 84

  // Grund: echtes Kamerabild, sonst Himmel-Verlauf
  const hintergrund = foto.hintergrund
    ? await ladeBild(foto.hintergrund).catch(() => null)
    : null
  if (hintergrund) {
    zeichneCover(ctx, hintergrund, rand, rand, flaecheB, flaecheH)
  } else {
    const grund = ctx.createLinearGradient(0, rand, 0, rand + flaecheH)
    grund.addColorStop(0, farben.himmel[0])
    grund.addColorStop(0.72, farben.himmel[1])
    grund.addColorStop(0.74, "#5b8c3a")
    grund.addColorStop(1, "#3e6a22")
    ctx.fillStyle = grund
    ctx.fillRect(rand, rand, flaecheB, flaecheH)
  }

  // Virtuelle Szene darüber — cover, damit nichts komisch schwimmt.
  // Mit Kamerabild dahinter deckt cover beide gleich und die Blöcke
  // bleiben ungefähr da, wo sie im Sucher waren.
  const vordergrund = await ladeBild(foto.vordergrund).catch(() => null)
  if (vordergrund) {
    zeichneCover(ctx, vordergrund, rand, rand, flaecheB, flaecheH)
  }

  ctx.strokeStyle = farben.rand
  ctx.lineWidth = 6
  ctx.strokeRect(rand - 3, rand - 3, flaecheB + 6, flaecheH + 6)

  // Briefmarke: Pixel-Bär
  const markeX = breite - rand - 128
  const markeY = rand + 16
  ctx.fillStyle = optionen.stil === "bern" ? "#1a140f" : "#d5372c"
  ctx.fillRect(markeX, markeY, 112, 132)
  ctx.strokeStyle = "#f7f2e2"
  ctx.setLineDash([8, 6])
  ctx.lineWidth = 4
  ctx.strokeRect(markeX + 5, markeY + 5, 102, 122)
  ctx.setLineDash([])
  ctx.fillStyle = optionen.stil === "bern" ? "#f1c232" : "#1a140f"
  const b = 8
  const baer: [number, number, number, number][] = [
    [3, 8, 8, 4],
    [9, 6, 3, 3],
    [10, 5, 1, 1],
    [3, 12, 1, 2],
    [9, 12, 1, 2],
    [2, 9, 1, 2],
  ]
  for (const [x, y, w, h] of baer) {
    ctx.fillRect(markeX + x * b, markeY + y * b, w * b, h * b)
  }
  ctx.fillStyle = "#f7f2e2"
  ctx.font = "bold 22px monospace"
  ctx.fillText("BÄRN", markeX + 22, markeY + 30)

  // Gruss — vom Spieler frei wählbar
  const gruss = optionen.gruss.trim() || "Grüsse us Bärn!"
  ctx.fillStyle = farben.text
  ctx.font = "bold 54px monospace"
  ctx.fillText(kuerze(ctx, gruss, breite - rand * 2 - 320), rand + 6, hoehe - 40)
  ctx.font = "26px monospace"
  ctx.fillStyle = farben.neben
  const datum = new Date().toLocaleDateString("de-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  ctx.textAlign = "right"
  ctx.fillText(`BärnGo · ${datum}`, breite - rand, hoehe - 40)
  ctx.textAlign = "left"
}

export async function bauePostkarte(
  foto: SzenenFoto,
  optionen: PostkartenOptionen,
): Promise<Blob> {
  const karte = document.createElement("canvas")
  await zeichnePostkarte(karte, foto, optionen)
  const blob = await new Promise<Blob | null>((res) =>
    karte.toBlob(res, "image/jpeg", 0.92),
  )
  if (!blob) throw new Error("Postkarte konnte nicht kodiert werden")
  return blob
}

// Web Share, wenn das Gerät Dateien teilen kann — sonst Download.
export async function teilePostkarte(blob: Blob): Promise<"geteilt" | "geladen"> {
  const datei = new File([blob], "baerngo-postkarte.jpg", {
    type: "image/jpeg",
  })
  const teilbar =
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [datei] })
  if (teilbar) {
    try {
      await navigator.share({ files: [datei], title: "BärnGo Postkarte" })
      return "geteilt"
    } catch {
      // Abgebrochen oder nicht erlaubt — dann eben herunterladen
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "baerngo-postkarte.jpg"
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  return "geladen"
}

// Bild formatfüllend einpassen (cover) und dabei hochkant/quer angleichen:
// das AR-Kamerabild kommt oft quer vom Sensor, der Sucher ist hochkant.
function zeichneCover(
  ctx: CanvasRenderingContext2D,
  bild: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  const zielQuer = w >= h
  const bildQuer = bild.width >= bild.height
  if (zielQuer !== bildQuer) {
    // 90° drehen, damit die Orientierung stimmt
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(Math.PI / 2)
    const skala = Math.max(h / bild.width, w / bild.height)
    ctx.drawImage(
      bild,
      (-bild.width * skala) / 2,
      (-bild.height * skala) / 2,
      bild.width * skala,
      bild.height * skala,
    )
  } else {
    const skala = Math.max(w / bild.width, h / bild.height)
    const zielB = bild.width * skala
    const zielH = bild.height * skala
    ctx.drawImage(bild, x + (w - zielB) / 2, y + (h - zielH) / 2, zielB, zielH)
  }
  ctx.restore()
}

function kuerze(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxBreite: number,
): string {
  let t = text
  while (t.length > 4 && ctx.measureText(t).width > maxBreite) {
    t = t.slice(0, -1)
  }
  return t === text ? t : `${t}…`
}

function ladeBild(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const bild = new Image()
    bild.onload = () => res(bild)
    bild.onerror = rej
    bild.src = url
  })
}
