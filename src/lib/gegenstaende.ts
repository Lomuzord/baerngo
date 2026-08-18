export type Gegenstand = {
  id: string
  name: string
  textur: string
}

const GEGENSTAENDE: Record<string, Gegenstand> = {
  gold: { id: "gold", name: "Gold", textur: "/bloecke/gold.png" },
  sandstein: { id: "sandstein", name: "Sandstein", textur: "/bloecke/sandstein.png" },
  honig: { id: "honig", name: "Honig", textur: "/bloecke/honig.png" },
  smaragd: { id: "smaragd", name: "Smaragd", textur: "/bloecke/smaragd.png" },
  buch: { id: "buch", name: "Buch", textur: "/bloecke/buch.png" },
  erde: { id: "erde", name: "Erde", textur: "/bloecke/erde.png" },
  gras: { id: "gras", name: "Gras", textur: "/bloecke/gras.png" },
  holz: { id: "holz", name: "Holz", textur: "/bloecke/holz.png" },
  stein: { id: "stein", name: "Stein", textur: "/bloecke/stein.png" },
  eisen: { id: "eisen", name: "Eisen", textur: "/bloecke/eisen.png" },
  kies: { id: "kies", name: "Kies", textur: "/bloecke/kies.png" },
  ziegel: { id: "ziegel", name: "Ziegel", textur: "/bloecke/ziegel.png" },
  goldblock: { id: "goldblock", name: "Goldblock", textur: "/bloecke/goldblock.png" },
  honigbrot: { id: "honigbrot", name: "Honigbrot", textur: "/bloecke/honigbrot.png" },
  bernwappen: { id: "bernwappen", name: "Bernwappen", textur: "/bloecke/bernwappen.png" },
  pickel: { id: "pickel", name: "Spitzhacke", textur: "/bloecke/pickel.png" },
  schwert: { id: "schwert", name: "Schwert", textur: "/bloecke/schwert.png" },
}

export function gegenstandById(id: string): Gegenstand | undefined {
  return GEGENSTAENDE[id]
}

export function listGegenstaende(): Gegenstand[] {
  return Object.values(GEGENSTAENDE)
}
