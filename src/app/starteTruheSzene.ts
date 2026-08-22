type TruheZustand = {
  offen: boolean
  bereit: boolean
}

export async function starteTruheSzene(
  el: HTMLElement,
  zustand: () => TruheZustand,
): Promise<() => void> {
  const THREE = await import("three")

  const breite = el.clientWidth || 280
  const hoehe = el.clientHeight || 280
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
  const kamera = new THREE.PerspectiveCamera(32, breite / hoehe, 0.1, 40)
  kamera.position.set(1.7, 1.45, 2.15)
  kamera.lookAt(0, 0.45, 0)

  szene.add(new THREE.AmbientLight(0xfff4e0, 0.55))
  const himmel = new THREE.HemisphereLight(0xfff2cc, 0x3a2412, 0.7)
  szene.add(himmel)
  const sonne = new THREE.DirectionalLight(0xffe6b0, 1.35)
  sonne.position.set(2.4, 4.2, 2.8)
  szene.add(sonne)
  const glanz = new THREE.PointLight(0xffc14d, 0.9, 6)
  glanz.position.set(0.2, 1.1, 1.3)
  szene.add(glanz)

  const holz = holzMaterial(THREE, "#c47a2e", "#7a4314", "#e2a04a")
  const holzDunkel = holzMaterial(THREE, "#8a4a18", "#4a240c", "#b56a28")
  const metall = new THREE.MeshStandardMaterial({
    color: 0x3a2a18,
    roughness: 0.45,
    metalness: 0.55,
  })
  const gold = new THREE.MeshStandardMaterial({
    color: 0xf0c14b,
    roughness: 0.28,
    metalness: 0.85,
    emissive: 0x6a4a10,
    emissiveIntensity: 0.35,
  })
  const innen = new THREE.MeshStandardMaterial({
    color: 0x2a160c,
    roughness: 1,
  })

  const truhe = new THREE.Group()
  szene.add(truhe)

  const schatten = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 32),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
    }),
  )
  schatten.rotation.x = -Math.PI / 2
  schatten.position.y = 0
  truhe.add(schatten)

  const korpus = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.62, 0.84), holz)
  korpus.position.y = 0.37
  truhe.add(korpus)

  const mulde = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.16, 0.68), innen)
  mulde.position.y = 0.62
  truhe.add(mulde)

  const bandLinks = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.64, 0.86),
    metall,
  )
  bandLinks.position.set(-0.42, 0.37, 0)
  const bandRechts = bandLinks.clone()
  bandRechts.position.x = 0.42
  truhe.add(bandLinks, bandRechts)

  const deckelPivot = new THREE.Group()
  deckelPivot.position.set(0, 0.68, -0.42)
  truhe.add(deckelPivot)

  const deckel = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.3, 0.88),
    holzDunkel,
  )
  deckel.position.set(0, 0.15, 0.42)
  deckelPivot.add(deckel)

  const deckelBand = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 0.06, 0.9),
    metall,
  )
  deckelBand.position.set(0, 0.02, 0.42)
  deckelPivot.add(deckelBand)

  const riegel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.1), gold)
  riegel.position.set(0, 0.02, 0.88)
  deckelPivot.add(riegel)
  const riegelKnauf = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.08), gold)
  riegelKnauf.position.set(0, -0.08, 0.9)
  deckelPivot.add(riegelKnauf)

  const funkenGeo = new THREE.BufferGeometry()
  const funkenZahl = 28
  const funkenPos = new Float32Array(funkenZahl * 3)
  const funkenBasis: { x: number; y: number; z: number; phase: number }[] = []
  for (let i = 0; i < funkenZahl; i++) {
    const a = (i / funkenZahl) * Math.PI * 2
    funkenBasis.push({
      x: Math.cos(a) * 0.7,
      y: 0.4 + (i % 5) * 0.12,
      z: Math.sin(a) * 0.55,
      phase: i * 0.37,
    })
  }
  funkenGeo.setAttribute("position", new THREE.BufferAttribute(funkenPos, 3))
  const funken = new THREE.Points(
    funkenGeo,
    new THREE.PointsMaterial({
      color: 0xffe08a,
      size: 0.055,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  )
  truhe.add(funken)

  const lootGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16)
  const lootMat = new THREE.MeshStandardMaterial({
    color: 0xffd24a,
    emissive: 0xaa7700,
    emissiveIntensity: 0.6,
    roughness: 0.35,
  })
  const loots: { mesh: InstanceType<typeof THREE.Mesh>; t: number }[] = []
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(lootGeo, lootMat)
    mesh.visible = false
    truhe.add(mesh)
    loots.push({ mesh, t: 0 })
  }

  let deckelWinkel = zustand().offen ? -2.05 : 0
  deckelPivot.rotation.x = deckelWinkel
  let warOffen = zustand().offen
  let punch = 0
  let rattle = 0
  const start = performance.now()

  const onZeiger = () => {
    const z = zustand()
    if (z.offen) rattle = 1
    else punch = 1
  }
  el.addEventListener("pointerdown", onZeiger)

  let rahmen = 0
  const tick = (now: number) => {
    const t = (now - start) / 1000
    const z = zustand()
    const ziel = z.offen ? -2.05 : 0
    deckelWinkel += (ziel - deckelWinkel) * 0.14
    if (z.offen && deckelWinkel < -1.7) {
      deckelWinkel += Math.sin(t * 18) * 0.004
    }
    deckelPivot.rotation.x = deckelWinkel

    if (z.offen && !warOffen) {
      for (let i = 0; i < loots.length; i++) {
        const loot = loots[i]
        loot.t = 0.001
        loot.mesh.visible = true
        loot.mesh.position.set((i - 3.5) * 0.08, 0.7, 0.1)
      }
    }
    warOffen = z.offen

    punch *= 0.86
    rattle *= 0.82
    const bob = z.bereit && !z.offen ? Math.sin(t * 2.5) * 0.07 : 0
    const orbit = z.bereit && !z.offen ? Math.sin(t * 0.7) * 0.28 : 0
    const wackeln = rattle * Math.sin(t * 42) * 0.08
    truhe.position.y = 0.04 + bob
    truhe.rotation.y = 0.42 + orbit + wackeln
    truhe.rotation.z = wackeln * 0.4
    const skala = 1 + punch * 0.12 - rattle * 0.03
    truhe.scale.setScalar(skala)

    glanz.intensity = z.bereit && !z.offen ? 0.75 + Math.sin(t * 4) * 0.45 : 0.25
    schatten.scale.setScalar(z.bereit && !z.offen ? 1 + Math.sin(t * 2.5) * 0.06 : 0.92)
    const schattenMat = schatten.material as InstanceType<
      typeof THREE.MeshBasicMaterial
    >
    schattenMat.opacity = z.offen ? 0.18 : 0.3

    const pos = funken.geometry.getAttribute("position")
    for (let i = 0; i < funkenZahl; i++) {
      const p = funkenBasis[i]
      const spin = t * 1.2 + p.phase
      pos.setXYZ(
        i,
        p.x * Math.cos(spin) - p.z * Math.sin(spin),
        p.y + Math.sin(t * 3 + p.phase) * 0.08 + (z.offen ? 0.35 : 0),
        p.x * Math.sin(spin) + p.z * Math.cos(spin),
      )
    }
    pos.needsUpdate = true
    const funkenMat = funken.material as InstanceType<
      typeof THREE.PointsMaterial
    >
    funkenMat.opacity = z.bereit
      ? 0.55 + Math.sin(t * 5) * 0.35
      : z.offen
        ? 0.2
        : 0.08
    funkenMat.size = z.bereit ? 0.06 : 0.04

    for (let i = 0; i < loots.length; i++) {
      const loot = loots[i]
      if (loot.t <= 0) continue
      loot.t += 0.016
      const u = loot.t
      const winkel = (i / loots.length) * Math.PI * 2
      loot.mesh.position.set(
        Math.cos(winkel) * u * 0.55,
        0.85 + u * 0.7 - u * u * 0.35,
        Math.sin(winkel) * u * 0.4,
      )
      loot.mesh.rotation.x = u * 4
      loot.mesh.rotation.y = u * 5
      if (u > 1.1) loot.mesh.visible = false
    }

    renderer.render(szene, kamera)
    rahmen = requestAnimationFrame(tick)
  }
  rahmen = requestAnimationFrame(tick)

  const onResize = () => {
    const w = el.clientWidth || 280
    const h = el.clientHeight || 280
    kamera.aspect = w / h
    kamera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener("resize", onResize)

  return () => {
    cancelAnimationFrame(rahmen)
    window.removeEventListener("resize", onResize)
    el.removeEventListener("pointerdown", onZeiger)
    // Alles freigeben, was die Szene hält — auch die Kisten-Geometrien
    // und das Schatten-Material, sonst bleiben GPU-Puffer liegen.
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

function holzMaterial(
  THREE: typeof import("three"),
  hell: string,
  dunkel: string,
  maser: string,
) {
  const canvas = document.createElement("canvas")
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext("2d")
  if (ctx) {
    ctx.fillStyle = hell
    ctx.fillRect(0, 0, 16, 16)
    ctx.fillStyle = dunkel
    for (let y = 0; y < 16; y += 4) {
      ctx.fillRect(0, y, 16, 1)
    }
    ctx.fillStyle = maser
    ctx.fillRect(2, 1, 3, 2)
    ctx.fillRect(10, 5, 3, 2)
    ctx.fillRect(5, 9, 4, 2)
    ctx.fillRect(12, 13, 2, 2)
    ctx.fillStyle = "#3a220e"
    ctx.fillRect(0, 0, 16, 1)
    ctx.fillRect(0, 15, 16, 1)
    ctx.fillRect(0, 0, 1, 16)
    ctx.fillRect(15, 0, 1, 16)
  }
  const textur = new THREE.CanvasTexture(canvas)
  textur.magFilter = THREE.NearestFilter
  textur.minFilter = THREE.NearestFilter
  textur.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshStandardMaterial({
    map: textur,
    roughness: 0.72,
    metalness: 0.05,
  })
}
