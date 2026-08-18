"use client"

import { useEffect, useRef } from "react"
import type { SichtMesh } from "@/lib/modelle"

export function ModellBuehne({
  mesh,
  klasse,
}: {
  mesh: SichtMesh
  klasse?: string
}) {
  const kasten = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = kasten.current
    if (!el) return
    let disposed = false
    let stop: (() => void) | undefined

    void (async () => {
      const THREE = await import("three")
      const { ColladaLoader } = await import(
        "three/addons/loaders/ColladaLoader.js"
      )
      if (disposed || !el) return

      const breite = el.clientWidth || 160
      const hoehe = el.clientHeight || 160
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(breite, hoehe)
      el.replaceChildren(renderer.domElement)

      const szene = new THREE.Scene()
      const kamera = new THREE.PerspectiveCamera(35, breite / hoehe, 0.1, 80)
      szene.add(new THREE.AmbientLight(0xffffff, 0.85))
      const sonne = new THREE.DirectionalLight(0xfff1d0, 1.1)
      sonne.position.set(4, 8, 6)
      szene.add(sonne)

      const wurzel = new THREE.Group()
      szene.add(wurzel)

      const collada = await new ColladaLoader().loadAsync(mesh.src)
      if (disposed) {
        renderer.dispose()
        return
      }
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
      kamera.position.set(radius * 1.4, radius * 0.7, radius * 1.8)
      kamera.lookAt(0, 0, 0)

      let rahmen = 0
      const tick = () => {
        wurzel.rotation.y += 0.012
        renderer.render(szene, kamera)
        rahmen = requestAnimationFrame(tick)
      }
      tick()

      stop = () => {
        cancelAnimationFrame(rahmen)
        renderer.dispose()
        el.replaceChildren()
      }
    })()

    return () => {
      disposed = true
      stop?.()
    }
  }, [mesh.src, mesh.textur])

  return (
    <div className={`mc-modell ${klasse ?? ""}`.trim()}>
      <div ref={kasten} className="mc-modell-canvas" />
      <p className="mc-modell-credit">{mesh.credit}</p>
    </div>
  )
}
