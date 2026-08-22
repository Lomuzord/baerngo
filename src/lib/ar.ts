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

export function sceneViewerUrl(gltfUrl: string, titel: string): string {
  const datei = encodeURIComponent(gltfUrl)
  const name = encodeURIComponent(titel)
  const fallback = encodeURIComponent(gltfUrl)
  return `intent://arvr.google.com/scene-viewer/1.0?file=${datei}&mode=ar_preferred&title=${name}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`
}

export function modelViewerArModi(): string {
  return "scene-viewer webxr quick-look"
}
