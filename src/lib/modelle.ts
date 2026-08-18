export type SichtMesh = {
  src: string
  textur?: string
  format: "collada"
  credit: string
}

const MESHES: Record<string, SichtMesh> = {
  baerengraben: {
    src: "/modelle/baer.dae",
    textur: "/modelle/baer.png",
    format: "collada",
    credit: "0 A.D. / Wildfire Games, CC BY-SA 3.0",
  },
}

export function meshFuerSehenswuerdigkeit(
  sehenswuerdigkeitId: string,
): SichtMesh | undefined {
  return MESHES[sehenswuerdigkeitId]
}
