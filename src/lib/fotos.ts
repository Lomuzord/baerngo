export type OrtFoto = {
  src: string
  credit: string
}

const FOTOS: Record<string, OrtFoto> = {
  zytglogge: {
    src: "/orte/zytglogge.jpg",
    credit: "Wikimedia Commons",
  },
  muenster: {
    src: "/orte/muenster.jpg",
    credit: "Wikimedia Commons",
  },
  baerengraben: {
    src: "/orte/baerengraben.jpg",
    credit: "Wikimedia Commons",
  },
  bundeshaus: {
    src: "/orte/bundeshaus.jpg",
    credit: "Wikimedia Commons",
  },
  gibb: {
    src: "/orte/gibb.jpg",
    credit: "Wikimedia Commons",
  },
}

export function fotoFuerSehenswuerdigkeit(
  sehenswuerdigkeitId: string,
): OrtFoto | undefined {
  return FOTOS[sehenswuerdigkeitId]
}
