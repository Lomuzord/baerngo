import mapboxgl, { type CustomLayerInterface } from "mapbox-gl"
import type { WeltModell } from "@/lib/weltModelle"
import { listWeltModelle } from "@/lib/weltModelle"

type Figur = {
  id: string
  standort: import("three").Group
  figur: import("three").Group
  scheibe: import("three").Mesh
  hoeheMeter: number
  lage: { lat: number; lng: number }
}

export function erstelleWeltModellLayer(gewaehlt: {
  current: string | null
}): CustomLayerInterface {
  const modelle = listWeltModelle()
  let karte: mapboxgl.Map | undefined
  let renderer: import("three").WebGLRenderer | undefined
  let szene: import("three").Scene | undefined
  let kamera: import("three").Camera | undefined
  let THREE: typeof import("three") | undefined
  const figuren: Figur[] = []

  const layer: CustomLayerInterface = {
    id: "welt-modelle",
    type: "custom",
    renderingMode: "3d",
    onAdd(map, gl) {
      karte = map
      void ladeSzene(map, gl, modelle, figuren).then((bereit) => {
        renderer = bereit.renderer
        szene = bereit.szene
        kamera = bereit.kamera
        THREE = bereit.THREE
        map.triggerRepaint()
      })
    },
    render(_gl, matrix) {
      if (!renderer || !szene || !kamera || !karte || !THREE) return
      const jetzt = performance.now() / 1000
      for (const figur of figuren) {
        aktualisiereFigur(THREE, figur, gewaehlt.current, jetzt)
      }
      kamera.projectionMatrix = new THREE.Matrix4().fromArray(matrix)
      renderer.resetState()
      renderer.render(szene, kamera)
      karte.triggerRepaint()
    },
    onRemove() {
      renderer?.dispose()
      renderer = undefined
      szene = undefined
      kamera = undefined
      figuren.length = 0
    },
  }
  return layer
}

async function ladeSzene(
  map: mapboxgl.Map,
  gl: WebGL2RenderingContext,
  modelle: WeltModell[],
  figuren: Figur[],
) {
  const THREE = await import("three")
  const { ColladaLoader } = await import(
    "three/addons/loaders/ColladaLoader.js"
  )
  const renderer = new THREE.WebGLRenderer({
    canvas: map.getCanvas(),
    context: gl,
    antialias: true,
  })
  renderer.autoClear = false

  const szene = new THREE.Scene()
  szene.add(new THREE.AmbientLight(0xffffff, 0.95))
  const sonne = new THREE.DirectionalLight(0xfff1d0, 1.2)
  sonne.position.set(80, 120, 60)
  szene.add(sonne)
  const kamera = new THREE.Camera()

  for (const modell of modelle) {
    const collada = await new ColladaLoader().loadAsync(modell.mesh.src)
    const mesh = collada.scene
    if (modell.mesh.textur) {
      const textur = await new THREE.TextureLoader().loadAsync(
        modell.mesh.textur,
      )
      textur.colorSpace = THREE.SRGBColorSpace
      textur.flipY = false
      mesh.traverse((objekt) => {
        if (objekt instanceof THREE.Mesh) {
          objekt.material = new THREE.MeshStandardMaterial({
            map: textur,
            roughness: 0.82,
          })
        }
      })
    }
    const box = new THREE.Box3().setFromObject(mesh)
    const mitte = box.getCenter(new THREE.Vector3())
    const groesse = box.getSize(new THREE.Vector3())
    mesh.position.sub(mitte)
    const einheit = Math.max(groesse.x, groesse.y, groesse.z) || 1
    const skala = modell.hoeheMeter / einheit
    mesh.scale.setScalar(skala)
    const nachSkalierung = new THREE.Box3().setFromObject(mesh)

    const figur = new THREE.Group()
    figur.add(mesh)

    const scheibe = new THREE.Mesh(
      new THREE.CircleGeometry(modell.hoeheMeter * 0.38, 40),
      new THREE.MeshBasicMaterial({
        color: 0x3de7ff,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    scheibe.rotation.x = -Math.PI / 2
    scheibe.position.y = nachSkalierung.min.y

    const standort = new THREE.Group()
    standort.add(scheibe)
    standort.add(figur)
    standort.matrixAutoUpdate = false
    szene.add(standort)
    figuren.push({
      id: modell.id,
      standort,
      figur,
      scheibe,
      hoeheMeter: modell.hoeheMeter,
      lage: modell.lage,
    })
  }

  return { renderer, szene, kamera, THREE }
}

function aktualisiereFigur(
  THREE: typeof import("three"),
  figur: Figur,
  gewaehltId: string | null,
  zeit: number,
) {
  const aktiv = figur.id === gewaehltId
  figur.figur.rotation.y = zeit * (aktiv ? 1.7 : 0.55)
  figur.figur.position.y = Math.sin(zeit * 1.7) * (aktiv ? 3.2 : 2.2)
  const material = figur.scheibe.material as import("three").MeshBasicMaterial
  material.color.set(aktiv ? 0xf1c232 : 0x3de7ff)

  const mc = mapboxgl.MercatorCoordinate.fromLngLat(
    [figur.lage.lng, figur.lage.lat],
    0,
  )
  const meter = mc.meterInMercatorCoordinateUnits()
  const rotationX = new THREE.Matrix4().makeRotationAxis(
    new THREE.Vector3(1, 0, 0),
    Math.PI / 2,
  )
  figur.standort.matrix
    .makeTranslation(mc.x, mc.y, mc.z)
    .scale(new THREE.Vector3(meter, -meter, meter))
    .multiply(rotationX)
}
