export function glbFuerGegenstand(_gegenstandId: string): string {
  return "/modelle/block.glb"
}

export function kannSceneViewer(ursprung: string): boolean {
  return ursprung.startsWith("https://")
}

export function webXrModus(): "immersive-ar" {
  return "immersive-ar"
}

export function webXrFeatures(): string[] {
  return ["hit-test", "local-floor"]
}

export function ndcVonViewport(
  clientX: number,
  clientY: number,
  css: { left: number; top: number; width: number; height: number },
  buffer: { width: number; height: number },
  viewport?: { x: number; y: number; width: number; height: number },
): { x: number; y: number } {
  if (css.width < 1 || css.height < 1 || buffer.width < 1 || buffer.height < 1) {
    return { x: 0, y: 0 }
  }
  const fbX = ((clientX - css.left) / css.width) * buffer.width
  const fbYUnten =
    buffer.height - ((clientY - css.top) / css.height) * buffer.height
  const feld = viewport ?? {
    x: 0,
    y: 0,
    width: buffer.width,
    height: buffer.height,
  }
  if (feld.width < 1 || feld.height < 1) return { x: 0, y: 0 }
  return {
    x: ((fbX - feld.x) / feld.width) * 2 - 1,
    y: ((fbYUnten - feld.y) / feld.height) * 2 - 1,
  }
}

export function xrViewportFeld(vp?: {
  x: number
  y: number
  z?: number
  w?: number
  width?: number
  height?: number
}): { x: number; y: number; width: number; height: number } | undefined {
  if (!vp) return undefined
  const width = vp.width ?? vp.z
  const height = vp.height ?? vp.w
  if (!width || !height) return undefined
  return { x: vp.x, y: vp.y, width, height }
}

type Punkt3 = { x: number; y: number; z: number }

// Wohin die Platte kommt, solange ARCore keine Fläche erkannt hat. Ein
// Tipp muss trotzdem etwas legen — aber nie ausser Sicht: Hält man das
// Handy fast waagrecht (z. B. zum Beamer), trifft der Strahl den Boden
// erst Dutzende Meter weiter, und die Platte wäre unsichtbar klein.
export function plattenOrtOhneFlaeche(
  kamera: Punkt3,
  blick: Punkt3,
  bodenTreffer: Punkt3 | null,
  lebensgross: boolean,
): Punkt3 {
  const reichweite = lebensgross ? 4 : 3
  // "local-floor" legt y = 0 auf den Boden. Liegt das nicht deutlich
  // unter dem Handy, taugt die Schätzung nicht: Handy in Brusthöhe.
  const bodenOk = kamera.y > 0.5
  if (
    bodenTreffer &&
    bodenOk &&
    Math.hypot(bodenTreffer.x - kamera.x, bodenTreffer.z - kamera.z) <=
      reichweite
  ) {
    return bodenTreffer
  }
  const bodenY = bodenOk ? 0 : kamera.y - 1.3
  const laenge = Math.hypot(blick.x, blick.z)
  if (laenge < 1e-6) return { x: kamera.x, y: bodenY, z: kamera.z }
  // Dort, wo der Blick den Boden trifft, höchstens in Reichweite.
  const weite =
    blick.y < 0
      ? Math.min(reichweite, ((kamera.y - bodenY) / -blick.y) * laenge)
      : reichweite
  return {
    x: kamera.x + (blick.x / laenge) * weite,
    y: bodenY,
    z: kamera.z + (blick.z / laenge) * weite,
  }
}

export function sceneViewerUrl(gltfUrl: string, titel: string): string {
  const datei = encodeURIComponent(gltfUrl)
  const name = encodeURIComponent(titel)
  const fallback = encodeURIComponent(gltfUrl)
  return `intent://arvr.google.com/scene-viewer/1.0?file=${datei}&mode=ar_preferred&title=${name}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`
}

export function modelViewerArModi(): string {
  return "scene-viewer webxr quick-look"
}
