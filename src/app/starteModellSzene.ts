import { passeKameraAn } from "@/lib/szeneKamera"
import type { SichtMesh } from "@/lib/modelle"

export async function starteModellSzene(
  el: HTMLElement,
  mesh: SichtMesh,
  drehung: () => number = () => 0.012,
): Promise<() => void> {
  const THREE = await import("three")

  const breite = el.clientWidth || 88
  const hoehe = el.clientHeight || 88
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(breite, hoehe)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  el.replaceChildren(renderer.domElement)

  const szene = new THREE.Scene()
  const kamera = new THREE.PerspectiveCamera(32, breite / hoehe, 0.05, 80)
  szene.add(new THREE.AmbientLight(0xffffff, 0.9))
  const sonne = new THREE.DirectionalLight(0xfff1d0, 1.15)
  sonne.position.set(4, 8, 6)
  szene.add(sonne)

  const wurzel = new THREE.Group()
  szene.add(wurzel)

  let figur: InstanceType<typeof THREE.Object3D>
  if (mesh.format === "gltf") {
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js")
    const gltf = await new GLTFLoader().loadAsync(mesh.src)
    if (!gltf) throw new Error("glTF-Modell fehlt")
    figur = gltf.scene
  } else {
    const { ColladaLoader } = await import(
      "three/addons/loaders/ColladaLoader.js"
    )
    const collada = await new ColladaLoader().loadAsync(mesh.src)
    if (!collada) throw new Error("Collada-Modell fehlt")
    figur = collada.scene
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
  }
  wurzel.add(figur)
  passeKameraAn(kamera, wurzel, {
    padding: 1.55,
    richtung: { x: 0.7, y: 0.28, z: 1 },
  })

  let rahmen = 0
  const tick = () => {
    wurzel.rotation.y += drehung()
    renderer.render(szene, kamera)
    rahmen = requestAnimationFrame(tick)
  }
  tick()

  return () => {
    cancelAnimationFrame(rahmen)
    szene.traverse((objekt) => {
      if (objekt instanceof THREE.Mesh) {
        objekt.geometry.dispose()
        const materialien = Array.isArray(objekt.material)
          ? objekt.material
          : [objekt.material]
        for (const material of materialien) {
          const mitTextur = material as {
            map?: { dispose(): void } | null
            dispose(): void
          }
          mitTextur.map?.dispose()
          material.dispose()
        }
      }
    })
    renderer.dispose()
    renderer.forceContextLoss()
    if (renderer.domElement.parentNode === el) el.replaceChildren()
  }
}
