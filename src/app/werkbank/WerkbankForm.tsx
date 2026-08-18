"use client"

import { useState } from "react"
import { gegenstandById } from "@/lib/gegenstaende"
import {
  ergebnisFuerRaster,
  leeresRaster,
  nimmCraft,
  type Raster,
} from "@/lib/werkbank"
import { useInventar } from "../useInventar"

type Gehalten = { id: string; von: "inv" | number }

export function WerkbankForm() {
  const { inventar, setzeInventar } = useInventar()
  const [raster, setRaster] = useState<Raster>(leeresRaster)
  const [gehalten, setGehalten] = useState<Gehalten | null>(null)
  const ergebnis = ergebnisFuerRaster(raster)
  const vorrat = Object.entries(inventar).filter(([, n]) => n > 0)

  function legeInRaster(index: number) {
    if (!gehalten) return
    const zelle = raster[index]
    const danach = [...raster] as Raster
    if (gehalten.von === "inv") {
      if ((inventar[gehalten.id] ?? 0) < 1) return
      danach[index] = gehalten.id
      const inv = { ...inventar, [gehalten.id]: inventar[gehalten.id] - 1 }
      if (inv[gehalten.id] <= 0) delete inv[gehalten.id]
      if (zelle) inv[zelle] = (inv[zelle] ?? 0) + 1
      setzeInventar(inv)
    } else {
      danach[index] = gehalten.id
      danach[gehalten.von] = zelle
    }
    setRaster(danach)
    setGehalten(null)
  }

  function zurueckInsInventar() {
    if (!gehalten) return
    if (gehalten.von === "inv") {
      setGehalten(null)
      return
    }
    const danach = [...raster] as Raster
    danach[gehalten.von] = null
    setRaster(danach)
    setzeInventar({
      ...inventar,
      [gehalten.id]: (inventar[gehalten.id] ?? 0) + 1,
    })
    setGehalten(null)
  }

  function nimmErgebnis() {
    const genommen = nimmCraft(inventar, raster)
    if (!genommen.ok) return
    setzeInventar(genommen.inventar)
    setRaster(genommen.raster)
    setGehalten(null)
  }

  return (
    <section className="mc-panel">
      <h1 className="mc-title">Werkbank</h1>
      <p className="mc-tagline">Zieh Blöcke in das 3×3 Feld.</p>

      <div className="mc-table">
        <div className="mc-grid3" onPointerUp={zurueckInsInventar}>
          {raster.map((zelle, index) => {
            const item = zelle ? gegenstandById(zelle) : null
            return (
              <button
                key={index}
                type="button"
                className="mc-slot mc-craft-slot"
                onPointerUp={(event) => {
                  event.stopPropagation()
                  if (gehalten) legeInRaster(index)
                  else if (zelle) setGehalten({ id: zelle, von: index })
                }}
              >
                {item ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.textur} alt={item.name} className="mc-slot-block" />
                ) : null}
              </button>
            )
          })}
        </div>
        <span className="mc-arrow">→</span>
        <button
          type="button"
          className="mc-slot mc-out-slot"
          disabled={!ergebnis}
          onPointerUp={nimmErgebnis}
          aria-label="Ergebnis nehmen"
        >
          {ergebnis ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ergebnis.textur}
              alt={ergebnis.name}
              className="mc-slot-block"
            />
          ) : null}
        </button>
      </div>

      <h2 className="mc-kicker">Inventar</h2>
      <ul className="mc-inv-grid">
        {vorrat.map(([id, anzahl]) => {
          const item = gegenstandById(id)
          return (
            <li key={id}>
              <button
                type="button"
                className="mc-slot mc-inv-slot"
                onPointerUp={() => setGehalten({ id, von: "inv" })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item?.textur ?? "/bloecke/erde.png"}
                  alt={item?.name ?? id}
                  className="mc-slot-block"
                />
                <span className="mc-slot-count">{anzahl}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {gehalten ? (
        <p className="mc-held">In der Hand: {gegenstandById(gehalten.id)?.name}</p>
      ) : (
        <p className="mc-tagline">2 Gold = Goldblock. Honig + Buch = Honigbrot.</p>
      )}
    </section>
  )
}
