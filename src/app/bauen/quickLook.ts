"use client"

// AR auf dem iPhone: Safari kann kein WebXR, aber Apples eigener
// AR-Viewer ("Quick Look") öffnet USDZ-Dateien nativ — Modell auf den
// Boden stellen, herumlaufen, fertig. Wir bauen das aktuelle Bauwerk
// clientseitig in eine USDZ um und reichen sie an Safari weiter.

import type { GesetzterBlock } from "@/lib/bauen"
import { tuerGespiegelt, tuerWinkel } from "@/lib/tuer"
import { poseVonZelle, TISCH_EBENE } from "@/lib/spielflaeche"
import {
  anzeigeArt,
  geometrieFuerBlock,
  materialFuerBlock,
  tuerAngelVersatz,
  tuerGeometrie,
} from "./blockMesh"

// Nur dort anbieten, wo es den nativen Viewer gibt und WebXR fehlt
export function kannQuickLook(): boolean {
  if (typeof navigator === "undefined") return false
  const istApple =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  return istApple && !("xr" in navigator)
}

export async function oeffneInQuickLook(
  bloecke: GesetzterBlock[],
  strom: Set<string>,
  kante: number,
): Promise<void> {
  const THREE = await import("three")
  const { USDZExporter } = await import(
    "three/examples/jsm/exporters/USDZExporter.js"
  )

  const szene = new THREE.Scene()
  const ebene = { ...TISCH_EBENE, kante }

  // Grasplatte als Boden des Bauwerks
  const seite = (5 * 2 + 1) * kante
  const platte = new THREE.Mesh(
    new THREE.BoxGeometry(seite, kante * 0.125, seite),
    await materialFuerBlock(THREE, "gras"),
  )
  platte.position.y = -kante * 0.0625
  szene.add(platte)

  for (const block of bloecke) {
    const art = anzeigeArt(block.gegenstandId, strom.has(block.id))
    // Quick Look kann keine Material-Arrays: auch Gras einfarbig
    const material = await materialFuerBlock(
      THREE,
      art === "gras" ? "gras" : art,
    )
    let mesh: InstanceType<typeof THREE.Mesh>
    const pose = poseVonZelle(block.zelle, ebene)
    if (block.gegenstandId === "tuer") {
      const gespiegelt = tuerGespiegelt(bloecke, block)
      mesh = new THREE.Mesh(tuerGeometrie(THREE, kante, gespiegelt), material)
      const angel = tuerAngelVersatz(kante, gespiegelt)
      mesh.position.set(pose.x + angel.x, pose.y + kante / 2, pose.z + angel.z)
      mesh.rotation.y = tuerWinkel(strom.has(block.id), gespiegelt)
    } else {
      mesh = new THREE.Mesh(geometrieFuerBlock(THREE, art, kante), material)
      mesh.position.set(pose.x, pose.y + kante / 2, pose.z)
    }
    szene.add(mesh)
  }

  const exporter = new USDZExporter()
  const daten = await exporter.parseAsync(szene)
  const blob = new Blob([daten as BlobPart], {
    type: "model/vnd.usdz+zip",
  })
  const url = URL.createObjectURL(blob)

  // Safari öffnet rel="ar"-Links im nativen AR-Viewer; das leere
  // Bild-Kind gehört laut Apple-Doku in den Link.
  const link = document.createElement("a")
  link.rel = "ar"
  link.href = url
  link.download = "baerngo-bauwerk.usdz"
  link.appendChild(document.createElement("img"))
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
