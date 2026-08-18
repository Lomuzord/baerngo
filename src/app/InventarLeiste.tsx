"use client"

import { gegenstandById } from "@/lib/gegenstaende"
import { hotbarSlots } from "@/lib/hotbar"
import type { Inventar } from "./useInventar"

export function InventarLeiste({ inventar }: { inventar: Inventar }) {
  const slots = hotbarSlots(inventar)

  return (
    <ol className="mc-hotbar" aria-label="Inventar">
      {slots.map((slot, index) => {
        const item = slot.id ? gegenstandById(slot.id) : null
        return (
          <li key={slot.id ?? `leer-${index}`} className="mc-slot">
            {item ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="mc-slot-block"
                src={item.textur}
                alt=""
                width={48}
                height={48}
              />
            ) : null}
            {item ? <span className="mc-slot-name">{item.name}</span> : null}
            {slot.anzahl > 0 ? (
              <span className="mc-slot-count">{slot.anzahl}</span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
