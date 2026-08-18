export type Ressource = {
  id: string
  name: string
  farbe: string
}

const RESSOURCEN_NACH_ORT: Record<string, Ressource> = {
  zytglogge: { id: "gold", name: "Gold", farbe: "#f1c232" },
  muenster: { id: "sandstein", name: "Sandstein", farbe: "#d4b483" },
  baerengraben: { id: "honig", name: "Honig", farbe: "#e09b1b" },
  bundeshaus: { id: "smaragd", name: "Smaragd", farbe: "#2ecc71" },
  gibb: { id: "buch", name: "Buch", farbe: "#6b4f2a" },
}

export function ressourceFuerSehenswuerdigkeit(
  sehenswuerdigkeitId: string,
): Ressource | undefined {
  return RESSOURCEN_NACH_ORT[sehenswuerdigkeitId]
}
