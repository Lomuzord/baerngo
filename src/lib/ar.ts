export function glbFuerGegenstand(_gegenstandId: string): string {
  return "/modelle/block.glb"
}

export function kannSceneViewer(ursprung: string): boolean {
  return ursprung.startsWith("https://")
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
