"use client"

import { gegenstandById } from "@/lib/gegenstaende"
import { HOTBAR_LAENGE, type InventarSlot } from "@/lib/inventar"

export function InventarLeiste({ slots }: { slots: InventarSlot[] }) {
  const hotbar = slots.slice(0, HOTBAR_LAENGE)
  while (hotbar.length < HOTBAR_LAENGE) hotbar.push(null)

  return (
    <ol className="mc-hotbar-raster mc-hotbar-leiste" aria-label="Hotbar">
      {hotbar.map((slot, index) => {
        const item = slot ? gegenstandById(slot.id) : null
        return (
          <li key={`hotbar-${index}`} className="mc-slot">
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
            {slot && slot.anzahl > 1 ? (
              <span className="mc-slot-count">{slot.anzahl}</span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
