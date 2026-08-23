import {
  abbaudauerMs,
  rissStufeVonAnteil,
  type AbbauStand,
} from "@/lib/abbauen"
import { tiefeMoeglich, tiefenOptionen } from "@/lib/tiefe"
import {
  ndcVonViewport,
  webXrFeatures,
  webXrModus,
  xrViewportFeld,
} from "@/lib/ar"
import {
  aktionFuerHand,
  blockObenInSpalte,
  type GesetzterBlock,
} from "@/lib/bauen"
import { tuerGespiegelt, tuerWinkel } from "@/lib/tuer"
import {
  BLOCK_KANTE_METER,
  EBENE_RADIUS_ZELLEN,
  plattenSeiteMeter,
  poseVonZelle,
  flaecheVonPunkt,
  zelleAnFlaeche,
  zelleVonPose,
  type Ebene,
  type Zelle,
} from "@/lib/spielflaeche"
import { anzeigeArt,
  geometrieFuerBlock,
  TIEFE_UNIFORMS,
  tuerAngelVersatz,
  tuerGeometrie,
  entferneRiss,
  materialFuerBlock,
  materialienFuerWuerfel,
  setzeFallZiel,
  setzeRiss,
  tickFall,
} from "./blockMesh"

export type ArSteuerung = {
  wahl: () => string | null
  kannSetzen: () => boolean
  werkzeug: () => string | null
  bloecke: () => GesetzterBlock[]
  abbau: () => AbbauStand
  aufSetzen: (zelle: Zelle) => void
  aufSchlag: (blockId: string) => boolean
  stromAn?: () => Set<string>
  aufSchalte?: (blockId: string) => boolean
}

export type ArMeldungen = {
  aufPlatte?: () => void
  aufEnde?: () => void
  // Laufende Klartext-Meldung zum Zustand der Verdeckung
  aufTiefe?: (text: string) => void
}

export type ArOptionen = {
  // true: Blöcke in Lebensgrösse (1 m) wie im echten Minecraft,
  // false: Tischplatte mit 16-cm-Blöcken.
  lebensgross?: boolean
  // true: echte Verdeckung — Blöcke verschwinden hinter Menschen,
  // Wänden und Möbeln, statt über dem Kamerabild zu kleben.
  verdeckung?: boolean
}

export async function starteBauenAr(
  leinwand: HTMLCanvasElement,
  steuerung: ArSteuerung,
  overlay: HTMLElement,
  meldungen: ArMeldungen = {},
  optionen: ArOptionen = {},
): Promise<{ beenden: () => void }> {
  const xr = navigator.xr
  if (!xr) throw new Error("WebXR fehlt")
  const modus = webXrModus()
  const erlaubt = await xr.isSessionSupported(modus)
  if (!erlaubt) throw new Error("immersive-ar nicht verfügbar")

  const THREE = await import("three")
  const session = await xr.requestSession(modus, {
    requiredFeatures: webXrFeatures(),
    optionalFeatures: [
      "dom-overlay",
      "plane-detection",
      "light-estimation",
      // Verdeckung: echte Tiefe pro Bildpunkt vom ARCore-Sensor
      ...(optionen.verdeckung ? ["depth-sensing"] : []),
    ],
    ...(optionen.verdeckung ? { depthSensing: tiefenOptionen() } : {}),
    domOverlay: { root: overlay },
  } as XRSessionInit)

  // Langdruck beim Abbauen darf im DOM-Overlay weder Textauswahl noch
  // Kontextmenü auslösen — CSS allein reicht auf Android Chrome nicht
  // zuverlässig, darum zusätzlich die Events selbst abwürgen.
  const schluckAuswahl = (event: Event) => event.preventDefault()
  const dok = overlay.ownerDocument
  dok.addEventListener("selectstart", schluckAuswahl)
  overlay.addEventListener("contextmenu", schluckAuswahl)

  // "end" sofort abfangen — die Systemgeste kann die Sitzung beenden,
  // während wir unten noch auf setSession/HitTest warten.
  let beendet = false
  let spaeterAbbau: (() => void) | null = null
  session.addEventListener("end", () => {
    if (beendet) return
    beendet = true
    dok.removeEventListener("selectstart", schluckAuswahl)
    overlay.removeEventListener("contextmenu", schluckAuswahl)
    spaeterAbbau?.()
    meldungen.aufEnde?.()
  })

  const renderer = new THREE.WebGLRenderer({
    canvas: leinwand,
    antialias: true,
    alpha: true,
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(1)
  renderer.setSize(overlay.ownerDocument.documentElement.clientWidth, overlay.ownerDocument.documentElement.clientHeight, false)
  renderer.xr.enabled = true
  renderer.xr.setReferenceSpaceType("local-floor")
  try {
    await renderer.xr.setSession(session)
  } catch (fehler) {
    renderer.dispose()
    void session.end().catch(() => {})
    throw fehler
  }
  if (beendet) {
    renderer.dispose()
    throw new Error("AR-Sitzung wurde schon beendet")
  }

  // Echtes Hit-Testing: die Platte landet auf erkannten Flächen
  // (Boden ODER Tisch) statt auf einer rechnerischen y=0-Ebene.
  let hitQuelle: XRHitTestSource | null = null
  try {
    const viewerSpace = await session.requestReferenceSpace("viewer")
    const quelle =
      (await session.requestHitTestSource?.({ space: viewerSpace })) ?? null
    if (beendet) {
      try {
        quelle?.cancel()
      } catch {
        // schon weg
      }
    } else {
      hitQuelle = quelle
    }
  } catch {
    hitQuelle = null
  }
  if (beendet) {
    renderer.dispose()
    throw new Error("AR-Sitzung wurde schon beendet")
  }
  let flaechenTreffer: { x: number; y: number; z: number } | null = null
  // Verdeckung: Tiefenbild des Geräts als kleine Textur, die alle
  // Block-Materialien im Shader abfragen.
  let tiefenTextur: InstanceType<typeof THREE.DataTexture> | null = null
  let tiefeGemeldet = false
  let tiefeKaputt = false
  let letzteTiefeMeldung = ""

  const szene = new THREE.Scene()
  const kamera = new THREE.PerspectiveCamera()
  szene.add(new THREE.AmbientLight(0xffffff, 1))
  const sonne = new THREE.DirectionalLight(0xffffff, 0.9)
  sonne.position.set(1, 3, 2)
  szene.add(sonne)

  const lebensgross = Boolean(optionen.lebensgross)
  const kante = lebensgross ? 1 : BLOCK_KANTE_METER
  let ebene: Ebene | null = null
  let gemeldet = false

  const visier = new THREE.Mesh(
    new THREE.BoxGeometry(kante * 0.96, kante * 0.96, kante * 0.96),
    new THREE.MeshBasicMaterial({
      color: 0x7cfc00,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  )
  visier.visible = false
  szene.add(visier)

  const ringSkala = kante / BLOCK_KANTE_METER
  const zielring = new THREE.Mesh(
    new THREE.RingGeometry(0.055 * ringSkala, 0.075 * ringSkala, 32).rotateX(
      -Math.PI / 2,
    ),
    new THREE.MeshBasicMaterial({
      color: 0x7cfc00,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  )
  zielring.visible = false
  szene.add(zielring)

  const wuerfel = new Map<string, InstanceType<typeof THREE.Mesh>>()
  const zeiger = new THREE.Vector2()
  const boden = new THREE.Plane()
  const bodenPunkt = new THREE.Vector3()
  let platteMesh: InstanceType<typeof THREE.Mesh> | null = null
  let zeigerBild: { x: number; y: number } | null = null

  async function sperreEbene(pose: { x: number; y: number; z: number }) {
    if (ebene) return
    // Lebensgross: Welt auf Fusshöhe verankern — "local-floor" legt
    // y=0 auf den echten Boden, so steht man selbst im Bauwerk.
    const y = lebensgross ? Math.min(pose.y, 0.02) : pose.y
    ebene = { ursprung: { x: pose.x, y, z: pose.z }, kante }
    zielring.visible = false
    try {
      hitQuelle?.cancel()
    } catch {
      // Quelle war schon beendet
    }
    hitQuelle = null
    // Gespeicherte Bauten sofort zeichnen — der Dirty-Check hat die
    // Liste evtl. schon konsumiert, bevor die Ebene existierte.
    letzteBloeckeListe = null
    const seite = plattenSeiteMeter(kante)
    const dicke = kante * 0.125
    const [gras, holz] = await Promise.all([
      materialFuerBlock(THREE, "gras"),
      materialFuerBlock(THREE, "holz"),
    ])
    const rahmen = new THREE.Mesh(
      new THREE.BoxGeometry(seite + kante * 0.5, dicke * 1.5, seite + kante * 0.5),
      holz,
    )
    rahmen.position.set(pose.x, y - dicke, pose.z)
    const platte = new THREE.Mesh(
      new THREE.BoxGeometry(seite, dicke, seite),
      gras,
    )
    platte.position.set(pose.x, y, pose.z)
    platteMesh = platte
    platte.userData.platte = true
    const pick = new THREE.Mesh(
      new THREE.PlaneGeometry(seite * 3, seite * 3),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
    )
    pick.rotation.x = -Math.PI / 2
    pick.position.set(pose.x, y + 0.001, pose.z)
    pick.userData.platte = true
    szene.add(pick)
    const raster = new THREE.GridHelper(
      seite,
      EBENE_RADIUS_ZELLEN * 2 + 1,
      0xf1c232,
      0x7cfc00,
    )
    raster.position.set(pose.x, y + dicke * 0.75, pose.z)
    szene.add(rahmen, platte, raster)
    if (!gemeldet) {
      gemeldet = true
      meldungen.aufPlatte?.()
    }
  }

  let zeichnet = false
  let zeichneNochmal = false
  async function zeichneBloecke() {
    if (!ebene) return
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
    if (!ebene) return
    const leben = new Set<string>()
    for (const block of steuerung.bloecke()) {
      leben.add(block.id)
      let mesh = wuerfel.get(block.id)
      const neu = !mesh
      if (!mesh) {
        const material = await materialienFuerWuerfel(THREE, block.gegenstandId)
        mesh = new THREE.Mesh(
          block.gegenstandId === "tuer"
            ? tuerGeometrie(THREE, kante, tuerGespiegelt(steuerung.bloecke(), block))
            : geometrieFuerBlock(THREE, block.gegenstandId, kante),
          material,
        )
        mesh.userData.blockId = block.id
        szene.add(mesh)
        wuerfel.set(block.id, mesh)
      }
      mesh.userData.zelle = block.zelle
      // Redstone-Optik auch in AR: Leuchten und offene Türen
      const strom = steuerung.stromAn?.() ?? new Set<string>()
      const artJetzt = anzeigeArt(block.gegenstandId, strom.has(block.id))
      if (mesh.userData.artJetzt !== artJetzt) {
        mesh.userData.artJetzt = artJetzt
        mesh.material = await materialienFuerWuerfel(THREE, artJetzt)
      }
      if (block.gegenstandId === "tuer") {
        // Doppeltüren hängen aussen: der rechte Flügel spiegelt.
        const gespiegelt = tuerGespiegelt(steuerung.bloecke(), block)
        if (mesh.userData.gespiegelt !== gespiegelt) {
          mesh.userData.gespiegelt = gespiegelt
          mesh.geometry.dispose()
          mesh.geometry = tuerGeometrie(THREE, kante, gespiegelt)
        }
        mesh.rotation.y = tuerWinkel(strom.has(block.id), gespiegelt)
        mesh.userData.angel = tuerAngelVersatz(kante, gespiegelt)
      }
      const roh = poseVonZelle(block.zelle, ebene)
      const angel = mesh.userData.angel as
        | { x: number; z: number }
        | undefined
      const pose = {
        ...roh,
        x: roh.x + (angel?.x ?? 0),
        z: roh.z + (angel?.z ?? 0),
      }
      const startY =
        neu && block.fallStart
          ? poseVonZelle(block.fallStart, ebene).y + kante / 2
          : undefined
      setzeFallZiel(
        mesh,
        { x: pose.x, y: pose.y + kante / 2, z: pose.z },
        startY,
      )
      if (xrAbbauId !== block.id) {
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

  const ray = new THREE.Raycaster()
  let zielZelle: Zelle | null = null
  // Block direkt unter dem Zeiger — für Tipp-Schalter (Hebel, Tür)
  let zielBlockId: string | null = null
  let xrHalten = false
  let xrAbbauId: string | null = null
  let xrAbbauStart = 0
  let xrHatZerstoert = false
  let xrDruckStart = 0

  function bestehendeZellen(): Zelle[] {
    return steuerung.bloecke().map((block) => block.zelle)
  }

  function xrSicht() {
    const xrCam = renderer.xr.getCamera()
    xrCam.updateMatrixWorld(true)
    const teil =
      "cameras" in xrCam && Array.isArray(xrCam.cameras) && xrCam.cameras[0]
        ? xrCam.cameras[0]
        : xrCam
    teil.updateMatrixWorld(true)
    return teil
  }

  function trefferBeiBildschirm(clientX: number, clientY: number) {
    const leinwand = renderer.domElement
    const box = leinwand.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) return undefined
    const sicht = xrSicht()
    // Der XR-Viewport ist in Framebuffer-Pixeln — die Canvasgrösse ist
    // CSS-Pixel. Beide Räume mischen lenkt jeden Tipp weit daneben.
    const basisEbene = session.renderState.baseLayer
    const puffer = basisEbene
      ? {
          width: basisEbene.framebufferWidth,
          height: basisEbene.framebufferHeight,
        }
      : { width: leinwand.width, height: leinwand.height }
    const ndc = ndcVonViewport(
      clientX,
      clientY,
      box,
      puffer,
      xrViewportFeld(
        "viewport" in sicht
          ? (sicht.viewport as {
              x: number
              y: number
              z?: number
              w?: number
              width?: number
              height?: number
            })
          : undefined,
      ),
    )
    zeiger.x = ndc.x
    zeiger.y = ndc.y
    ray.setFromCamera(zeiger, sicht)
    const treffer = ray
      .intersectObjects(szene.children, false)
      .filter((eintrag) => {
        const data = eintrag.object.userData as {
          blockId?: string
          platte?: boolean
        }
        return Boolean(data.blockId || data.platte)
      })
    const hit = treffer[0]
    if (hit) {
      return {
        point: hit.point,
        blockId: hit.object.userData.blockId as string | undefined,
        zelle: hit.object.userData.zelle as Zelle | undefined,
        zentrum:
          "position" in hit.object
            ? (hit.object.position as { x: number; y: number; z: number })
            : undefined,
      }
    }
    const y = ebene?.ursprung.y ?? 0
    boden.set(new THREE.Vector3(0, 1, 0), -y)
    if (!ray.ray.intersectPlane(boden, bodenPunkt)) return undefined
    return {
      point: { x: bodenPunkt.x, y: bodenPunkt.y, z: bodenPunkt.z },
      blockId: undefined as string | undefined,
      zelle: undefined as Zelle | undefined,
      zentrum: undefined as { x: number; y: number; z: number } | undefined,
    }
  }

  function zelleFuerTreffer(hit: {
    point: { x: number; y: number; z: number }
    zelle?: Zelle
    zentrum?: { x: number; y: number; z: number }
  }) {
    if (!ebene) return null
    if (hit.zelle && hit.zentrum) {
      return zelleAnFlaeche(
        {
          zelle: hit.zelle,
          normale: flaecheVonPunkt(hit.zentrum, hit.point, kante),
        },
        ebene,
        bestehendeZellen(),
      )
    }
    return zelleAnFlaeche(
      { punkt: { x: hit.point.x, y: hit.point.y, z: hit.point.z } },
      ebene,
      bestehendeZellen(),
    )
  }

  function xrBlockId() {
    if (!zeigerBild) return undefined
    const hit = trefferBeiBildschirm(zeigerBild.x, zeigerBild.y)
    if (!hit) return undefined
    if (hit.blockId) return hit.blockId
    if (!ebene) return undefined
    const spalte = zelleVonPose(hit.point, ebene)
    return blockObenInSpalte(steuerung.bloecke(), spalte)?.id
  }

  function brichXrAbbau() {
    if (xrAbbauId) {
      const mesh = wuerfel.get(xrAbbauId)
      if (mesh) setzeRiss(THREE, szene, mesh, 0, kante)
    }
    xrAbbauId = null
  }

  function beginneHalten() {
    xrHalten = true
    xrHatZerstoert = false
    zielBlockId = null
    xrDruckStart = performance.now()
    const id = xrBlockId()
    if (id) {
      xrAbbauId = id
      xrAbbauStart = xrDruckStart
    } else brichXrAbbau()
  }

  function setzeZeiger(event: Event) {
    if (!(event instanceof PointerEvent)) return
    zeigerBild = { x: event.clientX, y: event.clientY }
    const hit = trefferBeiBildschirm(event.clientX, event.clientY)
    if (!ebene) {
      const ziel =
        flaechenTreffer ??
        (hit ? { x: hit.point.x, y: hit.point.y, z: hit.point.z } : null)
      if (ziel) void sperreEbene(ziel)
    }
    zielZelle = hit && ebene ? zelleFuerTreffer(hit) : null
    zielBlockId = hit?.blockId ?? null
  }

  function endeHalten() {
    // Kurzer Tipp auf Hebel, Knopf oder Tür schaltet sie
    if (!xrHatZerstoert && zielBlockId && steuerung.aufSchalte?.(zielBlockId)) {
      void zeichneBloecke()
      xrHalten = false
      zeigerBild = null
      visier.visible = false
      brichXrAbbau()
      return
    }
    if (
      !xrHatZerstoert &&
      ebeneBeimDruck &&
      aktionFuerHand(steuerung.wahl()) === "setzen" &&
      steuerung.kannSetzen() &&
      zielZelle
    ) {
      steuerung.aufSetzen(zielZelle)
      void zeichneBloecke()
    }
    xrHalten = false
    zeigerBild = null
    visier.visible = false
    brichXrAbbau()
  }

  function istHud(event: Event) {
    const ziel = event.target
    return (
      ziel instanceof HTMLElement &&
      Boolean(
        ziel.closest("button, a, input, label, .mc-hotbar, .mc-hotbar-raster"),
      )
    )
  }

  let ebeneBeimDruck = false

  function aufOverlayDown(event: Event) {
    if (istHud(event)) return
    // Die Platte wird mit dem ersten Tipp gelegt — derselbe Tipp darf
    // nicht auch schon einen Block setzen.
    ebeneBeimDruck = Boolean(ebene)
    setzeZeiger(event)
    beginneHalten()
  }

  function aufOverlayMove(event: Event) {
    if (!xrHalten || istHud(event)) return
    setzeZeiger(event)
  }

  function aufOverlayUp(event: Event) {
    if (istHud(event)) return
    setzeZeiger(event)
    endeHalten()
  }

  overlay.addEventListener("pointerdown", aufOverlayDown)
  overlay.addEventListener("pointermove", aufOverlayMove)
  overlay.addEventListener("pointerup", aufOverlayUp)
  overlay.addEventListener("pointercancel", aufOverlayUp)

  let letzteBloeckeListe: GesetzterBlock[] | null = null
  let zuletzt = performance.now()
  renderer.setAnimationLoop((zeit, frame) => {
    // Fliegt hier ein Fehler heraus, fordert three kein neues Bild mehr
    // an — das Bild würde für immer einfrieren. Darum alles abfangen.
    try {
      zeichneBild(zeit, frame)
    } catch {
      // Nichts tun: das nächste Bild bekommt eine neue Chance
    }
  })

  function zeichneBild(zeit: number, frame: XRFrame | undefined) {
    const dt = Math.min(0.05, (zeit - zuletzt) / 1000)
    zuletzt = zeit
    if (!ebene && frame && hitQuelle) {
      const refSpace = renderer.xr.getReferenceSpace()
      const ergebnisse = frame.getHitTestResults(hitQuelle)
      const pose = refSpace ? ergebnisse[0]?.getPose(refSpace) : undefined
      if (pose) {
        flaechenTreffer = {
          x: pose.transform.position.x,
          y: pose.transform.position.y,
          z: pose.transform.position.z,
        }
        zielring.position.set(
          flaechenTreffer.x,
          flaechenTreffer.y + 0.004,
          flaechenTreffer.z,
        )
        zielring.visible = true
      } else {
        flaechenTreffer = null
        zielring.visible = false
      }
    }
    for (const mesh of wuerfel.values()) tickFall(mesh, dt)
    if (xrHalten && xrAbbauId) {
      const block = steuerung
        .bloecke()
        .find((eintrag) => eintrag.id === xrAbbauId)
      const mesh = wuerfel.get(xrAbbauId)
      if (block && mesh) {
        const dauer = abbaudauerMs(block.gegenstandId, steuerung.werkzeug())
        const anteil = (zeit - xrAbbauStart) / dauer
        setzeRiss(THREE, szene, mesh, rissStufeVonAnteil(anteil), kante)
        if (anteil >= 1) {
          const id = xrAbbauId
          xrHatZerstoert = true
          brichXrAbbau()
          steuerung.aufSchlag(id)
          void zeichneBloecke()
        }
      }
    }
    const visierMat = visier.material as InstanceType<
      typeof THREE.MeshBasicMaterial
    >
    if (zeigerBild) {
      const hit = trefferBeiBildschirm(zeigerBild.x, zeigerBild.y)
      if (!ebene) {
        const ziel =
          flaechenTreffer ??
          (hit ? { x: hit.point.x, y: hit.point.y, z: hit.point.z } : null)
        if (ziel) void sperreEbene(ziel)
      }
      const aktion = aktionFuerHand(steuerung.wahl())
      if (ebene && hit) {
        const blockId = hit.blockId
        if (aktion === "abbauen") {
          const oben = blockId
            ? steuerung.bloecke().find((block) => block.id === blockId)
            : blockObenInSpalte(
                steuerung.bloecke(),
                zelleVonPose(hit.point, ebene),
              )
          if (oben) {
            const rast = poseVonZelle(oben.zelle, ebene)
            visier.position.set(rast.x, rast.y + kante / 2, rast.z)
            visier.visible = true
            visierMat.color.setHex(0xec1c24)
            zielZelle = oben.zelle
          } else {
            visier.visible = false
            zielZelle = null
          }
        } else if (aktion === "setzen" && steuerung.kannSetzen()) {
          zielZelle = zelleFuerTreffer(hit)
          if (zielZelle) {
            const rast = poseVonZelle(zielZelle, ebene)
            visier.position.set(rast.x, rast.y + kante / 2, rast.z)
            visier.visible = true
            visierMat.color.setHex(0x7cfc00)
          } else visier.visible = false
        } else {
          visier.visible = false
          zielZelle = zelleFuerTreffer(hit)
        }
      } else {
        visier.visible = false
        zielZelle = null
      }
    } else visier.visible = false
    // Nur neu aufbauen, wenn sich die Blockliste wirklich geändert hat —
    // die Referenz wechselt bei jedem React-Commit, sonst nie.
    const aktuelle = steuerung.bloecke()
    if (aktuelle !== letzteBloeckeListe) {
      letzteBloeckeListe = aktuelle
      void zeichneBloecke()
    }
    pflegeVerdeckung(frame)
    renderer.render(szene, kamera)
  }


  // Liest das Tiefenbild des Geräts und legt es allen Block-Shadern
  // hin. ARCore liefert pro Bildpunkt Millimeter in zwei Bytes.
  function melde(text: string) {
    if (text === letzteTiefeMeldung) return
    letzteTiefeMeldung = text
    meldungen.aufTiefe?.(text)
  }

  function pflegeVerdeckung(frame: XRFrame | undefined) {
    if (!optionen.verdeckung || tiefeKaputt) return
    tiefeGemeldet = true
    const werte = TIEFE_UNIFORMS.tiefeWerte.value
    werte[1] = 0
    const sitzung = session as unknown as {
      enabledFeatures?: readonly string[]
      depthUsage?: string
      depthDataFormat?: string
    }
    if (!sitzung.enabledFeatures?.includes("depth-sensing")) {
      melde("Tiefe: vom Gerät nicht freigegeben")
      return
    }
    if (!tiefeMoeglich(session as never)) {
      melde(`Tiefe: falscher Modus (${sitzung.depthUsage ?? "?"})`)
      return
    }
    if (!frame) return
    try {
      const referenz = renderer.xr.getReferenceSpace()
      if (!referenz) return
      const pose = frame.getViewerPose(referenz)
      const sicht = pose?.views[0]
      if (!sicht) return
      type CpuTiefe = {
        data: ArrayBuffer
        width: number
        height: number
        rawValueToMeters: number
        normDepthBufferFromNormView: { matrix: Float32Array }
      }
      const holen = (
        frame as unknown as {
          getDepthInformation?: (sicht: XRView) => CpuTiefe | null
        }
      ).getDepthInformation
      if (typeof holen !== "function") {
        melde("Tiefe: getDepthInformation fehlt")
        return
      }
      const info = holen.call(frame, sicht)
      if (!info || !info.width || !info.height) {
        melde("Tiefe: keine Daten in diesem Bild")
        return
      }

      const bytes = new Uint8Array(info.data)
      if (
        !tiefenTextur ||
        tiefenTextur.image.width !== info.width ||
        tiefenTextur.image.height !== info.height
      ) {
        tiefenTextur?.dispose()
        tiefenTextur = new THREE.DataTexture(
          bytes,
          info.width,
          info.height,
          THREE.RGFormat,
          THREE.UnsignedByteType,
        )
        // Nicht glätten: die zwei Bytes sind eine Zahl, kein Farbwert.
        tiefenTextur.magFilter = THREE.NearestFilter
        tiefenTextur.minFilter = THREE.NearestFilter
        tiefenTextur.generateMipmaps = false
        tiefenTextur.unpackAlignment = 1
        TIEFE_UNIFORMS.tiefeKarte.value = tiefenTextur
      } else {
        tiefenTextur.image.data = bytes
      }
      tiefenTextur.needsUpdate = true

      TIEFE_UNIFORMS.tiefeUv.value.set(info.normDepthBufferFromNormView.matrix)
      // Sichtfeld: Chrome nutzt eine Projektions-Ebene, dann ist
      // renderState.baseLayer LEER. Die XR-Kamera von three kennt das
      // echte Feld in jedem Fall — sie ist die verlässliche Quelle.
      const ziel = TIEFE_UNIFORMS.tiefeFeld.value
      const xrKamera = renderer.xr.getCamera() as unknown as {
        cameras?: { viewport?: { x: number; y: number; z: number; w: number } }[]
      }
      const sichtFeld = xrKamera.cameras?.[0]?.viewport
      const ausEbene = session.renderState.baseLayer?.getViewport(sicht)
      if (sichtFeld && sichtFeld.z > 0 && sichtFeld.w > 0) {
        ziel[0] = sichtFeld.x
        ziel[1] = sichtFeld.y
        ziel[2] = sichtFeld.z
        ziel[3] = sichtFeld.w
      } else if (ausEbene && ausEbene.width > 0 && ausEbene.height > 0) {
        ziel[0] = ausEbene.x
        ziel[1] = ausEbene.y
        ziel[2] = ausEbene.width
        ziel[3] = ausEbene.height
      } else {
        melde("Tiefe: kein Sichtfeld gefunden")
        return
      }
      werte[0] = info.rawValueToMeters
      werte[1] = 1
      melde(
        `Tiefe aktiv · ${info.width}×${info.height} · Feld ${Math.round(
          ziel[2],
        )}×${Math.round(ziel[3])}`,
      )
    } catch (fehler) {
      // Ein einziger Fehlversuch darf die Sitzung nicht kippen —
      // Verdeckung bleibt dann für diese Sitzung einfach aus.
      tiefeKaputt = true
      werte[1] = 0
      melde(`Tiefe: Fehler — ${String(fehler).slice(0, 60)}`)
    }
  }

  spaeterAbbau = () => {
    overlay.removeEventListener("pointerdown", aufOverlayDown)
    overlay.removeEventListener("pointermove", aufOverlayMove)
    overlay.removeEventListener("pointerup", aufOverlayUp)
    overlay.removeEventListener("pointercancel", aufOverlayUp)
    TIEFE_UNIFORMS.tiefeWerte.value[1] = 0
    TIEFE_UNIFORMS.tiefeKarte.value = null
    tiefenTextur?.dispose()
    tiefenTextur = null
    renderer.setAnimationLoop(null)
    try {
      hitQuelle?.cancel()
    } catch {
      // Quelle war schon beendet
    }
    renderer.dispose()
  }

  function beenden() {
    if (beendet) return
    beendet = true
    spaeterAbbau?.()
    void session.end().catch(() => {})
    meldungen.aufEnde?.()
  }

  return { beenden }
}
