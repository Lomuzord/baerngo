import {
  Box3,
  Vector3,
  type Object3D,
  type PerspectiveCamera,
} from "three"

export function passeKameraAn(
  kamera: PerspectiveCamera,
  objekt: Object3D,
  {
    padding = 1.42,
    richtung = { x: 0.62, y: 0.34, z: 1 },
  }: {
    padding?: number
    richtung?: { x: number; y: number; z: number }
  } = {},
) {
  objekt.updateWorldMatrix(true, true)
  const box = new Box3().setFromObject(objekt)
  const groesse = box.getSize(new Vector3())
  const mitte = box.getCenter(new Vector3())
  objekt.worldToLocal(mitte)
  for (const kind of objekt.children) {
    kind.position.sub(mitte)
  }
  const radius = Math.max(groesse.length() / 2, 0.01)
  const fov = (kamera.fov * Math.PI) / 180
  const distanz = (radius / Math.sin(fov / 2)) * padding
  const laenge = Math.hypot(richtung.x, richtung.y, richtung.z) || 1
  kamera.position.set(
    (richtung.x / laenge) * distanz,
    (richtung.y / laenge) * distanz,
    (richtung.z / laenge) * distanz,
  )
  kamera.near = Math.max(0.02, distanz / 120)
  kamera.far = distanz * 24
  kamera.lookAt(0, 0, 0)
  kamera.updateProjectionMatrix()
}

export function kameraFuerKartenblick(
  kamera: PerspectiveCamera,
  distanz: number,
  pitchGrad: number,
  bearingGrad: number,
) {
  const pitch = (Math.min(85, Math.max(0, pitchGrad)) * Math.PI) / 180
  const bearing = (bearingGrad * Math.PI) / 180
  const y = distanz * Math.cos(pitch)
  const horiz = distanz * Math.sin(pitch)
  kamera.position.set(
    -horiz * Math.sin(bearing),
    y,
    horiz * Math.cos(bearing),
  )
  if (pitch < 0.14) {
    kamera.up.set(Math.sin(bearing), 0, -Math.cos(bearing))
  } else {
    kamera.up.set(0, 1, 0)
  }
  kamera.lookAt(0, 0, 0)
  kamera.updateProjectionMatrix()
}

export function yawFuerBlick(blickGrad: number): number {
  return Math.PI - (blickGrad * Math.PI) / 180
}
