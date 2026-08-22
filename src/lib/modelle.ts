export type SichtMesh = {
  src: string
  textur?: string
  format: "collada" | "gltf"
  credit: string
}

const VOXEL_CREDIT = "BärnGo, prozedural erzeugtes Voxelmodell"

const MESHES: Record<string, SichtMesh> = {
  baerengraben: {
    src: "/modelle/baerengraben.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  bundeshaus: {
    src: "/modelle/bundeshaus.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  zytglogge: {
    src: "/modelle/zytglogge.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  muenster: {
    src: "/modelle/muenster.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  gibb: {
    src: "/modelle/gibb.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  rosengarten: {
    src: "/modelle/rosengarten.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  kaefigturm: {
    src: "/modelle/kaefigturm.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  einsteinhaus: {
    src: "/modelle/einsteinhaus.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  "zentrum-paul-klee": {
    src: "/modelle/zentrum-paul-klee.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  gurten: {
    src: "/modelle/gurten.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  kunstmuseum: {
    src: "/modelle/kunstmuseum.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  nydeggkirche: {
    src: "/modelle/nydeggkirche.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  "botanischer-garten": {
    src: "/modelle/botanischer-garten.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  heiliggeistkirche: {
    src: "/modelle/heiliggeistkirche.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  "franzoesische-kirche": {
    src: "/modelle/franzoesische-kirche.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  tierpark: {
    src: "/modelle/tierpark.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  kornhaus: {
    src: "/modelle/kornhaus.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  "naturhistorisches-museum": {
    src: "/modelle/naturhistorisches-museum.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
  universitaet: {
    src: "/modelle/universitaet.glb",
    format: "gltf",
    credit: VOXEL_CREDIT,
  },
}

export function meshFuerSehenswuerdigkeit(
  sehenswuerdigkeitId: string,
): SichtMesh | undefined {
  return MESHES[sehenswuerdigkeitId]
}
