export async function maleIsoWuerfel(
  el: HTMLElement,
  obenUrl: string,
  seiteUrl = obenUrl,
): Promise<() => void> {
  const canvas = document.createElement("canvas")
  canvas.width = 80
  canvas.height = 72
  canvas.className = "mc-iso-leinwand"
  el.replaceChildren(canvas)
  // Nur die eigene Leinwand wegräumen — ein verspätetes Cleanup darf
  // die Leinwand eines Nachfolgers nicht löschen.
  const aufraeumen = () => {
    if (canvas.parentNode === el) canvas.remove()
  }
  const ctx = canvas.getContext("2d")
  if (!ctx) return aufraeumen
  ctx.imageSmoothingEnabled = false

  try {
    const [oben, seite] = await Promise.all([
      ladeBild(obenUrl),
      ladeBild(seiteUrl),
    ])
    zeichneIso(ctx, oben, seite)
  } catch {
    ctx.fillStyle = "#6b4a2a"
    ctx.fillRect(24, 16, 32, 32)
  }

  return aufraeumen
}

function ladeBild(url: string): Promise<HTMLImageElement> {
  return new Promise((ok, fehl) => {
    const bild = new Image()
    bild.onload = () => ok(bild)
    bild.onerror = () => fehl(new Error(url))
    bild.src = url
  })
}

function zeichneIso(
  ctx: CanvasRenderingContext2D,
  oben: HTMLImageElement,
  seite: HTMLImageElement,
) {
  const kante = 26
  const ox = 40
  const oy = 10
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  maleFlaeche(
    ctx,
    seite,
    { x: ox - kante, y: oy + kante / 2 },
    { x: kante, y: kante / 2 },
    { x: 0, y: kante },
    0.78,
  )
  maleFlaeche(
    ctx,
    seite,
    { x: ox, y: oy + kante },
    { x: kante, y: -kante / 2 },
    { x: 0, y: kante },
    0.55,
  )
  maleFlaeche(
    ctx,
    oben,
    { x: ox, y: oy },
    { x: kante, y: kante / 2 },
    { x: -kante, y: kante / 2 },
    1,
  )
}

function maleFlaeche(
  ctx: CanvasRenderingContext2D,
  bild: HTMLImageElement,
  ursprung: { x: number; y: number },
  u: { x: number; y: number },
  v: { x: number; y: number },
  hell: number,
) {
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.filter = `brightness(${hell})`
  ctx.transform(u.x, u.y, v.x, v.y, ursprung.x, ursprung.y)
  ctx.drawImage(bild, 0, 0, bild.width, bild.height, 0, 0, 1, 1)
  ctx.restore()
}
