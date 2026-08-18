import { gegenstandById, type Gegenstand } from "./gegenstaende"

const ORT_ZU_GEGENSTAND: Record<string, string> = {
  zytglogge: "gold",
  muenster: "sandstein",
  baerengraben: "honig",
  bundeshaus: "smaragd",
  gibb: "buch",
}

export type Ressource = Gegenstand

export function ressourceFuerSehenswuerdigkeit(
  sehenswuerdigkeitId: string,
): Gegenstand | undefined {
  const id = ORT_ZU_GEGENSTAND[sehenswuerdigkeitId]
  return id ? gegenstandById(id) : undefined
}
