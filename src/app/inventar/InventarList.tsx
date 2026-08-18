"use client"

import { gegenstandById } from "@/lib/gegenstaende"
import { hotbarSlots } from "@/lib/hotbar"
import { useInventar } from "../useInventar"
import { usePickel } from "../usePickel"

export function InventarList() {
  const { inventar } = useInventar()
  const { haltbarkeit, maximum } = usePickel()
  const eintraege = Object.entries(inventar).filter(([, n]) => n > 0)
  const hotbar = hotbarSlots(inventar)

  return (
    <section className="mc-panel">
      <h1 className="mc-title">Inventar</h1>
      <ol className="mc-hotbar" aria-label="Hotbar">
        {hotbar.map((slot, index) => {
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
              {slot.anzahl > 0 ? (
                <span className="mc-slot-count">{slot.anzahl}</span>
              ) : null}
            </li>
          )
        })}
      </ol>
      {(inventar.pickel ?? 0) > 0 ? (
        <p className="mc-pickel-bar">
          Pickel {haltbarkeit || maximum}/{maximum}
        </p>
      ) : null}
      {eintraege.length === 0 ? (
        <p className="mc-tagline">Noch leer. Löse ein Quiz vor Ort.</p>
      ) : (
        <ul className="mc-inv-grid">
          {eintraege.map(([id, anzahl]) => {
            const item = gegenstandById(id)
            return (
              <li key={id} className="mc-slot mc-inv-slot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item?.textur ?? "/bloecke/erde.png"}
                  alt=""
                  className="mc-slot-block"
                  width={64}
                  height={64}
                />
                <span className="mc-slot-name">{item?.name ?? id}</span>
                <span className="mc-slot-count">{anzahl}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
