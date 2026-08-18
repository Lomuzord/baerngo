"use client"

import { gegenstandById } from "@/lib/gegenstaende"
import { useInventar } from "../useInventar"

export function InventarList() {
  const { inventar } = useInventar()
  const eintraege = Object.entries(inventar).filter(([, n]) => n > 0)

  return (
    <section className="mc-panel">
      <h1 className="mc-title">Inventar</h1>
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
