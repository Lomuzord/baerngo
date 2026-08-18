import type { SichtMesh } from "@/lib/modelle"

export async function starteModellSzene(
  el: HTMLElement,
  mesh: SichtMesh,
  drehung: () => number = () => 0.012,
): Promise<() => void> {
  const THREE = await import("three")
  const { ColladaLoader } = await import(
    "three/addons/loaders/ColladaLoader.js"
  )

  const breite = el.clientWidth || 88
  const hoehe = el.clientHeight || 88
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(breite, hoehe)
  renderer.setClearColor(0x000000, 0)
  el.replaceChildren(renderer.domElement)

  const szene = new THREE.Scene()
  const kamera = new THREE.PerspectiveCamera(35, breite / hoehe, 0.1, 80)
  szene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const sonne = new THREE.DirectionalLight(0xfff1d0, 1.15)
  sonne.position.set(4, 8, 6)
  szene.add(sonne)

  const wurzel = new THREE.Group()
  szene.add(wurzel)

  const collada = await new ColladaLoader().loadAsync(mesh.src)
  const figur = collada.scene
  if (mesh.textur) {
    const textur = await new THREE.TextureLoader().loadAsync(mesh.textur)
    textur.colorSpace = THREE.SRGBColorSpace
    textur.flipY = false
    figur.traverse((objekt) => {
      if (objekt instanceof THREE.Mesh) {
        objekt.material = new THREE.MeshStandardMaterial({
          map: textur,
          roughness: 0.85,
        })
      }
    })
  }
  wurzel.add(figur)

  const box = new THREE.Box3().setFromObject(figur)
  const mitte = box.getCenter(new THREE.Vector3())
  const groesse = box.getSize(new THREE.Vector3())
  figur.position.sub(mitte)
  const radius = Math.max(groesse.x, groesse.y, groesse.z)
  kamera.position.set(radius * 1.35, radius * 0.55, radius * 1.7)
  kamera.lookAt(0, 0, 0)

  let rahmen = 0
  const tick = () => {
    wurzel.rotation.y += drehung()
    renderer.render(szene, kamera)
    rahmen = requestAnimationFrame(tick)
  }
  tick()

  return () => {
    cancelAnimationFrame(rahmen)
    renderer.dispose()
    el.replaceChildren()
  }
}
