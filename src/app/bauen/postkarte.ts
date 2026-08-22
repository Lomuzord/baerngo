// AR-Postkarte: legt einen Schnappschuss der Bau-Szene in einen
// Berner Postkartenrahmen und teilt ihn (Web Share) oder lädt ihn.

export async function bauePostkarte(bildUrl: string): Promise<Blob> {
  const bild = await ladeBild(bildUrl)
  const breite = 1200
  const hoehe = 860
  const karte = document.createElement("canvas")
  karte.width = breite
  karte.height = hoehe
  const ctx = karte.getContext("2d")
  if (!ctx) throw new Error("kein 2d-Kontext")

  // Rahmen: weiss mit feinem Braunrand wie eine alte Karte
  ctx.fillStyle = "#f7f2e2"
  ctx.fillRect(0, 0, breite, hoehe)

  // Bildfläche mit Berner Himmel als Grund (AR-Frames sind transparent,
  // wo die Kamera war — der Himmel füllt das auf)
  const rand = 46
  const flaecheB = breite - rand * 2
  const flaecheH = hoehe - rand * 2 - 84
  const grund = ctx.createLinearGradient(0, rand, 0, rand + flaecheH)
  grund.addColorStop(0, "#7ec8e3")
  grund.addColorStop(0.72, "#cfe9f5")
  grund.addColorStop(0.74, "#5b8c3a")
  grund.addColorStop(1, "#3e6a22")
  ctx.fillStyle = grund
  ctx.fillRect(rand, rand, flaecheB, flaecheH)

  // Schnappschuss einpassen (contain, zentriert)
  const skala = Math.min(flaecheB / bild.width, flaecheH / bild.height)
  const zielB = bild.width * skala
  const zielH = bild.height * skala
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(
    bild,
    rand + (flaecheB - zielB) / 2,
    rand + (flaecheH - zielH) / 2,
    zielB,
    zielH,
  )
  ctx.strokeStyle = "#4a3a28"
  ctx.lineWidth = 6
  ctx.strokeRect(rand - 3, rand - 3, flaecheB + 6, flaecheH + 6)

  // Briefmarke oben rechts: Bern-Rot mit Bär-Silhouette (Pixel-Stil)
  const markeX = breite - rand - 128
  const markeY = rand + 16
  ctx.fillStyle = "#d5372c"
  ctx.fillRect(markeX, markeY, 112, 132)
  ctx.strokeStyle = "#f7f2e2"
  ctx.setLineDash([8, 6])
  ctx.lineWidth = 4
  ctx.strokeRect(markeX + 5, markeY + 5, 102, 122)
  ctx.setLineDash([])
  ctx.fillStyle = "#1a140f"
  // grober Pixel-Bär
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

  // Gruss und Datum unten
  ctx.fillStyle = "#2b2118"
  ctx.font = "bold 54px monospace"
  ctx.fillText("Grüsse us Bärn!", rand + 6, hoehe - 40)
  ctx.font = "26px monospace"
  ctx.fillStyle = "#6b5a40"
  const datum = new Date().toLocaleDateString("de-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  ctx.textAlign = "right"
  ctx.fillText(`BärnGo · ${datum}`, breite - rand, hoehe - 40)
  ctx.textAlign = "left"

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

function ladeBild(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const bild = new Image()
    bild.onload = () => res(bild)
    bild.onerror = rej
    bild.src = url
  })
}
