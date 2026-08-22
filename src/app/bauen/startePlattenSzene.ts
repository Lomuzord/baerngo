import {
  abbaudauerMs,
  rissStufeVonAnteil,
  type AbbauStand,
} from "@/lib/abbauen"
import {
  aktionFuerHand,
  blockObenInSpalte,
  type GesetzterBlock,
} from "@/lib/bauen"
import {
  BLOCK_KANTE_METER,
  EBENE_RADIUS_ZELLEN,
  TISCH_EBENE,
  plattenSeiteMeter,
  poseVonZelle,
  flaecheVonPunkt,
  zelleAnFlaeche,
  zelleVonPose,
  type Zelle,
} from "@/lib/spielflaeche"
import { geometrieFuerBlock,
  entferneRiss,
  materialFuerBlock,
  materialienFuerWuerfel,
  setzeFallZiel,
  setzeRiss,
  tickFall,
} from "./blockMesh"

export type PlattenSteuerung = {
  wahl: () => string | null
  kannSetzen: () => boolean
  werkzeug: () => string | null
  bloecke: () => GesetzterBlock[]
  abbau: () => AbbauStand
  aufSetzen: (zelle: Zelle) => void
  aufSchlag: (blockId: string) => boolean
  // Meldet eine Funktion an, die den nächsten gerenderten Frame
  // als Daten-URL liefert (für die Postkarte).
  fotoBereit?: (
    mach: () => Promise<{ vordergrund: string; hintergrund?: string }>,
  ) => void
  // Untergrund-Mine: Grabstand pro Spalte, nächste Schicht, Grabschlag
  mineSpalten?: () => { ix: number; iz: number; tiefe: number }[]
  mineNaechste?: (
    ix: number,
    iz: number,
  ) => { tiefe: number; art: string } | null
  aufMineSchlag?: (ix: number, iz: number) => boolean
}

export async function startePlattenSzene(
  leinwand: HTMLCanvasElement,
  steuerung: PlattenSteuerung,
): Promise<() => void> {
  const THREE = await import("three")
  const renderer = new THREE.WebGLRenderer({
    canvas: leinwand,
    antialias: true,
    alpha: false,
  })
  renderer.setClearColor(0x6ec6ff, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const szene = new THREE.Scene()
  szene.fog = new THREE.Fog(0x6ec6ff, 6, 14)
  const kamera = new THREE.PerspectiveCamera(40, 1, 0.05, 40)
  szene.add(new THREE.AmbientLight(0xfff6e0, 0.7))
  const himmel = new THREE.HemisphereLight(0x9ad0ff, 0x5b8c3a, 0.55)
  szene.add(himmel)
  const sonne = new THREE.DirectionalLight(0xfff1c8, 1.15)
  sonne.position.set(2.4, 4.2, 1.6)
  szene.add(sonne)

  const kante = BLOCK_KANTE_METER
  const seite = plattenSeiteMeter()
  const [gras, erde, holz] = await Promise.all([
    materialFuerBlock(THREE, "gras"),
    materialFuerBlock(THREE, "erde"),
    materialFuerBlock(THREE, "holz"),
  ])

  const boden = new THREE.Mesh(
    new THREE.CircleGeometry(8, 48),
    new THREE.MeshStandardMaterial({ color: 0x4f8a32, roughness: 1 }),
  )
  boden.rotation.x = -Math.PI / 2
  boden.position.y = -0.12
  szene.add(boden)

  const rahmen = new THREE.Mesh(
    new THREE.BoxGeometry(seite + 0.12, 0.1, seite + 0.12),
    holz,
  )
  rahmen.position.y = -0.06
  szene.add(rahmen)

  const platte = new THREE.Mesh(
    new THREE.BoxGeometry(seite, 0.06, seite),
    [erde, erde, gras, erde, erde, erde],
  )
  platte.position.y = -0.02
  platte.userData.platte = true
  szene.add(platte)

  const raster = new THREE.GridHelper(
    seite,
    EBENE_RADIUS_ZELLEN * 2 + 1,
    0x3d2b1f,
    0x7cfc00,
  )
  raster.position.y = 0.011
  szene.add(raster)

  const visier = new THREE.Mesh(
    new THREE.BoxGeometry(kante * 0.96, kante * 0.96, kante * 0.96),
    new THREE.MeshStandardMaterial({
      color: 0x7cfc00,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  )
  visier.visible = false
  szene.add(visier)

  const wuerfel = new Map<string, InstanceType<typeof THREE.Mesh>>()
  // Ausgehobene Spalten als dunkle "Loch"-Kacheln auf der Platte,
  // mit der Textur der nächsten Schicht als Grubenboden.
  const gruben = new Map<string, InstanceType<typeof THREE.Mesh>>()
  let grubenSignatur = ""
  async function zeichneGruben() {
    const spalten = steuerung.mineSpalten?.() ?? []
    const leben = new Set<string>()
    for (const spalte of spalten) {
      const key = `${spalte.ix},${spalte.iz}`
      leben.add(key)
      const naechste = steuerung.mineNaechste?.(spalte.ix, spalte.iz)
      let mesh = gruben.get(key)
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(kante * 0.94, 0.012, kante * 0.94),
          new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 }),
        )
        const pose = poseVonZelle(
          { ix: spalte.ix, iy: 0, iz: spalte.iz },
          TISCH_EBENE,
        )
        mesh.position.set(pose.x, 0.012, pose.z)
        mesh.userData.mine = key
        szene.add(mesh)
        gruben.set(key, mesh)
      }
      // Grubenboden: Textur der nächsten Schicht, mit Tiefe dunkler
      const art = naechste?.art ?? "stein"
      const material = (await materialFuerBlock(THREE, art)).clone()
      const dunkel = Math.max(0.15, 1 - spalte.tiefe * 0.055)
      material.color.setScalar(dunkel)
      mesh.material = material
    }
    for (const [key, mesh] of gruben) {
      if (leben.has(key)) continue
      szene.remove(mesh)
      mesh.geometry.dispose()
      gruben.delete(key)
    }
  }
  const ray = new THREE.Raycaster()
  const zeiger = new THREE.Vector2()
  let rotY = 0.72
  let polar = 0.38
  let abstand = 2.7
  let ziehen = false
  let startX = 0
  let startY = 0
  let lastX = 0
  let lastY = 0
  let hatGezogen = false
  let hatGehalten = false
  let abbauId: string | null = null
  let abbauStart = 0

  function passeAn() {
    const w = leinwand.clientWidth || window.innerWidth
    const h = leinwand.clientHeight || window.innerHeight
    kamera.aspect = w / Math.max(h, 1)
    kamera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h, false)
  }

  function setzeKamera() {
    kamera.position.set(
      abstand * Math.sin(rotY) * Math.cos(polar),
      abstand * Math.sin(polar) + 0.15,
      abstand * Math.cos(rotY) * Math.cos(polar),
    )
    kamera.lookAt(0, 0.12, 0)
  }

  let fotoWunsch:
    | ((foto: { vordergrund: string; hintergrund?: string }) => void)
    | null = null
  let zeichnet = false
  let zeichneNochmal = false
  async function zeichneBloecke() {
    if (zeichnet) {
      zeichneNochmal = true
      return
    }
    zeichnet = true
    try {
      do {
        zeichneNochmal = false
        await zeichneBloeckeJetzt()
      } while (zeichneNochmal)
    } finally {
      zeichnet = false
    }
  }

  async function zeichneBloeckeJetzt() {
    const leben = new Set<string>()
    for (const block of steuerung.bloecke()) {
      leben.add(block.id)
      let mesh = wuerfel.get(block.id)
      const neu = !mesh
      if (!mesh) {
        const material = await materialienFuerWuerfel(THREE, block.gegenstandId)
        mesh = new THREE.Mesh(
          geometrieFuerBlock(THREE, block.gegenstandId, kante),
          material,
        )
        mesh.userData.blockId = block.id
        szene.add(mesh)
        wuerfel.set(block.id, mesh)
      }
      mesh.userData.zelle = block.zelle
      const pose = poseVonZelle(block.zelle, TISCH_EBENE)
      const startY =
        neu && block.fallStart
          ? poseVonZelle(block.fallStart, TISCH_EBENE).y + kante / 2
          : undefined
      setzeFallZiel(
        mesh,
        { x: pose.x, y: pose.y + kante / 2, z: pose.z },
        startY,
      )
      if (abbauId !== block.id) {
        setzeRiss(THREE, szene, mesh, 0, kante)
      }
    }
    for (const [id, mesh] of wuerfel) {
      if (leben.has(id)) continue
      entferneRiss(szene, mesh)
      szene.remove(mesh)
      mesh.geometry.dispose()
      wuerfel.delete(id)
    }
  }

  function trefferBei(clientX: number, clientY: number) {
    const box = leinwand.getBoundingClientRect()
    zeiger.x = ((clientX - box.left) / box.width) * 2 - 1
    zeiger.y = -((clientY - box.top) / box.height) * 2 + 1
    ray.setFromCamera(zeiger, kamera)
    const objekte = [platte, ...wuerfel.values()]
    return ray.intersectObjects(objekte, false)[0]
  }

  function zelleFuerTreffer(hit: {
    object: {
      userData: { zelle?: Zelle }
      position: { x: number; y: number; z: number }
    }
    point: { x: number; y: number; z: number }
  }): Zelle | null {
    return zelleAnFlaeche(
      flaechenTreffer(hit),
      TISCH_EBENE,
      steuerung.bloecke().map((block) => block.zelle),
    )
  }

  function visierFarbe(hex: number) {
    const mat = visier.material as InstanceType<
      typeof THREE.MeshStandardMaterial
    >
    mat.color.setHex(hex)
  }

  function blockZumAbbau(hit: ReturnType<typeof trefferBei>) {
    if (!hit) return undefined
    const direkt = hit.object.userData.blockId as string | undefined
    if (direkt) return direkt
    const raster = zelleVonPose(
      { x: hit.point.x, y: 0, z: hit.point.z },
      TISCH_EBENE,
    )
    const block = blockObenInSpalte(steuerung.bloecke(), raster)?.id
    if (block) return block
    // Leere Spalte: in die Mine graben, wenn dort noch etwas liegt
    if (
      Math.abs(raster.ix) <= EBENE_RADIUS_ZELLEN &&
      Math.abs(raster.iz) <= EBENE_RADIUS_ZELLEN &&
      steuerung.mineNaechste?.(raster.ix, raster.iz)
    ) {
      return `mine:${raster.ix},${raster.iz}`
    }
    return undefined
  }

  function mineMeshFuer(abbau: string) {
    return gruben.get(abbau.slice(5)) ?? grabDecal
  }

  // Beim Angraben einer unberührten Spalte gibt es noch keine Grube —
  // dieses Decal trägt dann die Riss-Anzeige.
  const grabDecal = new THREE.Mesh(
    new THREE.BoxGeometry(kante * 0.94, 0.012, kante * 0.94),
    new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 1 }),
  )
  grabDecal.visible = false
  szene.add(grabDecal)

  function brichAbbau() {
    if (abbauId) {
      const mesh = abbauId.startsWith("mine:")
        ? mineMeshFuer(abbauId)
        : wuerfel.get(abbauId)
      if (mesh) setzeRiss(THREE, szene, mesh, 0, kante)
    }
    grabDecal.visible = false
    abbauId = null
  }

  function starteAbbau(blockId: string, jetzt: number) {
    if (abbauId === blockId) return
    brichAbbau()
    abbauId = blockId
    abbauStart = jetzt
  }

  function tickAbbau(jetzt: number) {
    if (!ziehen || hatGezogen || !abbauId) return
    if (abbauId.startsWith("mine:")) {
      const [ix, iz] = abbauId
        .slice(5)
        .split(",")
        .map((wert) => Number.parseInt(wert, 10))
      const naechste = steuerung.mineNaechste?.(ix!, iz!)
      if (!naechste) {
        brichAbbau()
        return
      }
      const mesh = mineMeshFuer(abbauId)
      if (mesh === grabDecal) {
        const pose = poseVonZelle({ ix: ix!, iy: 0, iz: iz! }, TISCH_EBENE)
        grabDecal.position.set(pose.x, 0.012, pose.z)
        grabDecal.visible = true
      }
      const dauer = abbaudauerMs(naechste.art, steuerung.werkzeug())
      const anteil = (jetzt - abbauStart) / dauer
      setzeRiss(THREE, szene, mesh, rissStufeVonAnteil(anteil), kante)
      if (anteil < 1) return
      hatGehalten = true
      brichAbbau()
      steuerung.aufMineSchlag?.(ix!, iz!)
      void zeichneGruben()
      return
    }
    const block = steuerung.bloecke().find((eintrag) => eintrag.id === abbauId)
    const mesh = wuerfel.get(abbauId)
    if (!block || !mesh) {
      brichAbbau()
      return
    }
    const dauer = abbaudauerMs(block.gegenstandId, steuerung.werkzeug())
    const anteil = (jetzt - abbauStart) / dauer
    setzeRiss(THREE, szene, mesh, rissStufeVonAnteil(anteil), kante)
    if (anteil < 1) return
    const id = abbauId
    hatGehalten = true
    brichAbbau()
    steuerung.aufSchlag(id)
    void zeichneBloecke()
  }

  function aktualisiereVisier(clientX: number, clientY: number) {
    const aktion = aktionFuerHand(steuerung.wahl())
    const hit = trefferBei(clientX, clientY)
    const abbauId = blockZumAbbau(hit)
    if (aktion === "abbauen") {
      const mesh = abbauId ? wuerfel.get(abbauId) : undefined
      if (mesh) {
        visierFarbe(0xec1c24)
        visier.position.copy(mesh.position)
        visier.visible = true
        return
      }
      visier.visible = false
      return
    }
    if (aktion !== "setzen" || !hit || !steuerung.kannSetzen()) {
      visier.visible = false
      return
    }
    const zelle = zelleFuerTreffer(hit)
    if (!zelle) {
      visier.visible = false
      return
    }
    visierFarbe(0x7cfc00)
    const pose = poseVonZelle(zelle, TISCH_EBENE)
    visier.position.set(pose.x, pose.y + kante / 2, pose.z)
    visier.visible = true
  }

  function aufZeiger(event: PointerEvent) {
    if (hatGezogen || hatGehalten) return
    const hit = trefferBei(event.clientX, event.clientY)
    if (!hit) return
    if (aktionFuerHand(steuerung.wahl()) !== "setzen" || !steuerung.kannSetzen()) {
      return
    }
    const zelle = zelleFuerTreffer(hit)
    if (!zelle) return
    steuerung.aufSetzen(zelle)
    void zeichneBloecke()
  }

  const onDown = (event: PointerEvent) => {
    ziehen = true
    hatGezogen = false
    hatGehalten = false
    startX = lastX = event.clientX
    startY = lastY = event.clientY
    leinwand.setPointerCapture(event.pointerId)
    aktualisiereVisier(event.clientX, event.clientY)
    const blockId = blockZumAbbau(trefferBei(event.clientX, event.clientY))
    if (blockId) starteAbbau(blockId, performance.now())
    else brichAbbau()
  }
  const onMove = (event: PointerEvent) => {
    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    lastX = event.clientX
    lastY = event.clientY
    if (!ziehen) {
      aktualisiereVisier(event.clientX, event.clientY)
      return
    }
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > 36) {
      hatGezogen = true
      visier.visible = false
      brichAbbau()
    }
    if (!hatGezogen) {
      aktualisiereVisier(event.clientX, event.clientY)
      const blockId = blockZumAbbau(trefferBei(event.clientX, event.clientY))
      if (blockId && blockId !== abbauId) starteAbbau(blockId, performance.now())
      return
    }
    rotY -= dx * 0.008
    polar = Math.min(1.05, Math.max(0.16, polar + dy * 0.006))
  }
  const onUp = (event: PointerEvent) => {
    if (!ziehen) return
    ziehen = false
    if (abbauId && performance.now() - abbauStart > 250) hatGehalten = true
    aufZeiger(event)
    brichAbbau()
    try {
      leinwand.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
  }
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    abstand = Math.min(4.6, Math.max(1.7, abstand + event.deltaY * 0.003))
  }

  leinwand.addEventListener("pointerdown", onDown)
  leinwand.addEventListener("pointermove", onMove)
  leinwand.addEventListener("pointerup", onUp)
  leinwand.addEventListener("pointercancel", onUp)
  leinwand.addEventListener("wheel", onWheel, { passive: false })
  window.addEventListener("resize", passeAn)

  passeAn()
  setzeKamera()
  await zeichneBloecke()

  let loopId = 0
  let signatur = ""
  let zuletzt = performance.now()
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - zuletzt) / 1000)
    zuletzt = now
    const jetzt = `${steuerung
      .bloecke()
      .map(
        (block) =>
          `${block.id}:${block.zelle.ix},${block.zelle.iy},${block.zelle.iz}`,
      )
      .join(",")}|${JSON.stringify(steuerung.abbau())}|${steuerung.werkzeug()}`
    if (jetzt !== signatur) {
      signatur = jetzt
      void zeichneBloecke()
    }
    const grubenJetzt = (steuerung.mineSpalten?.() ?? [])
      .map((spalte) => `${spalte.ix},${spalte.iz}:${spalte.tiefe}`)
      .join("|")
    if (grubenJetzt !== grubenSignatur) {
      grubenSignatur = grubenJetzt
      void zeichneGruben()
    }
    for (const mesh of wuerfel.values()) tickFall(mesh, dt)
    tickAbbau(now)
    setzeKamera()
    renderer.render(szene, kamera)
    if (fotoWunsch) {
      // Direkt nach dem Render ist der Puffer noch gültig
      const mach = fotoWunsch
      fotoWunsch = null
      mach({ vordergrund: leinwand.toDataURL("image/png") })
    }
    loopId = requestAnimationFrame(tick)
  }
  loopId = requestAnimationFrame(tick)

  steuerung.fotoBereit?.(
    () =>
      new Promise<{ vordergrund: string; hintergrund?: string }>((res) => {
        fotoWunsch = res
      }),
  )

  return () => {
    cancelAnimationFrame(loopId)
    window.removeEventListener("resize", passeAn)
    leinwand.removeEventListener("pointerdown", onDown)
    leinwand.removeEventListener("pointermove", onMove)
    leinwand.removeEventListener("pointerup", onUp)
    leinwand.removeEventListener("pointercancel", onUp)
    leinwand.removeEventListener("wheel", onWheel)
    renderer.dispose()
    for (const mesh of gruben.values()) {
      entferneRiss(szene, mesh)
      mesh.geometry.dispose()
    }
    grabDecal.geometry.dispose()
    for (const mesh of wuerfel.values()) {
      entferneRiss(szene, mesh)
      mesh.geometry.dispose()
    }
  }
}

function flaechenTreffer(
  hit: {
    object: {
      userData: { zelle?: Zelle }
      position: { x: number; y: number; z: number }
    }
    point: { x: number; y: number; z: number }
  },
) {
  const zelle = hit.object.userData.zelle
  if (zelle) {
    return {
      zelle,
      normale: flaecheVonPunkt(
        hit.object.position,
        hit.point,
        BLOCK_KANTE_METER,
      ),
    }
  }
  return {
    punkt: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
  }
}
