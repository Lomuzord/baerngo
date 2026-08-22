export type OrtFoto = {
  src: string
  credit: string
}

const FOTOS: Record<string, OrtFoto> = {
  zytglogge: {
    src: "/orte/zytglogge.jpg",
    credit: "BärnGo-Illustration",
  },
  muenster: {
    src: "/orte/muenster.jpg",
    credit: "BärnGo-Illustration",
  },
  baerengraben: {
    src: "/orte/baerengraben.jpg",
    credit: "BärnGo-Illustration",
  },
  bundeshaus: {
    src: "/orte/bundeshaus.jpg",
    credit: "BärnGo-Illustration",
  },
  gibb: {
    src: "/orte/gibb.jpg",
    credit: "BärnGo-Illustration",
  },
  rosengarten: {
    src: "/orte/rosengarten.jpg",
    credit: "BärnGo-Illustration",
  },
  kaefigturm: {
    src: "/orte/kaefigturm.jpg",
    credit: "BärnGo-Illustration",
  },
  einsteinhaus: {
    src: "/orte/einsteinhaus.jpg",
    credit: "BärnGo-Illustration",
  },
  "zentrum-paul-klee": {
    src: "/orte/zentrum-paul-klee.jpg",
    credit: "BärnGo-Illustration",
  },
  gurten: {
    src: "/orte/gurten.jpg",
    credit: "BärnGo-Illustration",
  },
  kunstmuseum: {
    src: "/orte/kunstmuseum.jpg",
    credit: "BärnGo-Illustration",
  },
  nydeggkirche: {
    src: "/orte/nydeggkirche.jpg",
    credit: "BärnGo-Illustration",
  },
  "botanischer-garten": {
    src: "/orte/botanischer-garten.jpg",
    credit: "BärnGo-Illustration",
  },
  heiliggeistkirche: {
    src: "/orte/heiliggeistkirche.jpg",
    credit: "BärnGo-Illustration",
  },
  "franzoesische-kirche": {
    src: "/orte/franzoesische-kirche.jpg",
    credit: "BärnGo-Illustration",
  },
  tierpark: {
    src: "/orte/tierpark.jpg",
    credit: "BärnGo-Illustration",
  },
  kornhaus: {
    src: "/orte/kornhaus.jpg",
    credit: "BärnGo-Illustration",
  },
  "naturhistorisches-museum": {
    src: "/orte/naturhistorisches-museum.jpg",
    credit: "BärnGo-Illustration",
  },
  universitaet: {
    src: "/orte/universitaet.jpg",
    credit: "BärnGo-Illustration",
  },
}

export function fotoFuerSehenswuerdigkeit(
  sehenswuerdigkeitId: string,
): OrtFoto | undefined {
  return FOTOS[sehenswuerdigkeitId]
}
