import { materialienFuerWuerfel } from "./bauen/blockMesh"

export async function starteBlockSzene(
  el: HTMLElement,
  gegenstandId: string,
): Promise<() => void> {
  const THREE = await import("three")
  const breite = el.clientWidth || 36
  const hoehe = el.clientHeight || 36
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(breite, hoehe)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  el.replaceChildren(renderer.domElement)

  const szene = new THREE.Scene()
  const kamera = new THREE.PerspectiveCamera(32, breite / hoehe, 0.1, 20)
  kamera.position.set(2.05, 1.55, 2.15)
  kamera.lookAt(0, 0, 0)
  szene.add(new THREE.AmbientLight(0xfff6e0, 0.55))
  szene.add(new THREE.HemisphereLight(0xc8e6ff, 0x5a3a1c, 0.55))
  const sonne = new THREE.DirectionalLight(0xfff1c8, 1.15)
  sonne.position.set(2.2, 3.4, 1.6)
  szene.add(sonne)
  const fuell = new THREE.DirectionalLight(0xa8c8ff, 0.55)
  fuell.position.set(-2.4, 1.2, -1.8)
  szene.add(fuell)

  const material = await materialienFuerWuerfel(THREE, gegenstandId)
  const wuerfel = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
  wuerfel.rotation.x = 0.38
  szene.add(wuerfel)

  let rahmen = 0
  const start = performance.now()
  const tick = (now: number) => {
    const t = (now - start) / 1000
    wuerfel.rotation.y = t * 1.15
    wuerfel.rotation.x = 0.38 + Math.sin(t * 0.7) * 0.08
    wuerfel.position.y = Math.sin(t * 2.2) * 0.06
    renderer.render(szene, kamera)
    rahmen = requestAnimationFrame(tick)
  }
  rahmen = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(rahmen)
    wuerfel.geometry.dispose()
    renderer.dispose()
    // Ohne forceContextLoss läuft der Tab nach ein paar Vorschauen in
    // das WebGL-Kontextlimit und alle Canvases werden schwarz.
    renderer.forceContextLoss()
    // Nur räumen, wenn noch unsere Leinwand drin hängt — sonst löscht
    // ein verspätetes Cleanup die Szene des Nachfolgers.
    if (renderer.domElement.parentNode === el) el.replaceChildren()
  }
}
