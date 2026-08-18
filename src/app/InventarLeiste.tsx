"use client"

import { ressourceFuerSehenswuerdigkeit } from "@/lib/sammeln"
import { listSehenswuerdigkeiten } from "@/lib/katalog"
import type { Inventar } from "./useInventar"

export function InventarLeiste({ inventar }: { inventar: Inventar }) {
  const slots = listSehenswuerdigkeiten()
    .map((eintrag) => ressourceFuerSehenswuerdigkeit(eintrag.id))
    .filter((ressource) => ressource !== undefined)

  return (
    <ol className="mc-hotbar" aria-label="Inventar">
      {slots.map((ressource) => (
        <li key={ressource.id} className="mc-slot">
          <span
            className="mc-slot-block"
            style={{ background: ressource.farbe }}
            aria-hidden
          />
          <span className="mc-slot-name">{ressource.name}</span>
          <span className="mc-slot-count">{inventar[ressource.id] ?? 0}</span>
        </li>
      ))}
    </ol>
  )
}
