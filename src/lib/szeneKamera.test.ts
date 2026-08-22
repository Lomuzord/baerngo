import { Box3, BoxGeometry, Group, Mesh, PerspectiveCamera, Vector3 } from "three"
import { describe, expect, it } from "vitest"
import { kameraFuerKartenblick, passeKameraAn, yawFuerBlick } from "./szeneKamera"

describe("passeKameraAn", () => {
  it("keeps the mesh inside the sphere after a yaw turn", () => {
    const wurzel = new Group()
    const mesh = new Mesh(new BoxGeometry(4, 1.2, 1.6))
    mesh.position.set(1.2, 0.4, -0.8)
    wurzel.add(mesh)
    const kamera = new PerspectiveCamera(32, 1, 0.1, 80)
    passeKameraAn(kamera, wurzel, { padding: 1.5 })

    const radius = new Box3()
      .setFromObject(wurzel)
      .getSize(new Vector3())
      .length() / 2
    wurzel.rotation.y = Math.PI / 2
    wurzel.updateWorldMatrix(true, true)
    const mitte = new Box3().setFromObject(wurzel).getCenter(new Vector3())
    expect(mitte.length()).toBeLessThan(0.05)
    expect(kamera.position.length()).toBeGreaterThan(radius)
  })
})

describe("kameraFuerKartenblick", () => {
  it("looks down at pitch 0 and from the south at bearing 0", () => {
    const kamera = new PerspectiveCamera(28, 1, 0.1, 80)
    kameraFuerKartenblick(kamera, 10, 0, 0)
    expect(kamera.position.x).toBeCloseTo(0)
    expect(kamera.position.z).toBeCloseTo(0)
    expect(kamera.position.y).toBeCloseTo(10)

    kameraFuerKartenblick(kamera, 10, 85, 0)
    expect(kamera.position.y).toBeLessThan(2)
    expect(kamera.position.z).toBeGreaterThan(9)
    expect(kamera.position.x).toBeCloseTo(0)
    expect(yawFuerBlick(0)).toBeCloseTo(Math.PI)
  })
})

