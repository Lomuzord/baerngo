"use client"

import { useState } from "react"
import { gegenstandById } from "@/lib/gegenstaende"
import { craft, listRezepte } from "@/lib/werkbank"
import { useInventar } from "../useInventar"

export function WerkbankForm() {
  const { inventar, setzeInventar } = useInventar()
  const [meldung, setMeldung] = useState<string | null>(null)

  return (
    <section className="mc-panel">
      <h1 className="mc-title">Werkbank</h1>
      <p className="mc-tagline">Lege Blöcke auf den Tisch.</p>
      <ul className="mc-rezepte">
        {listRezepte().map((rezept) => (
          <li key={rezept.id} className="mc-rezept">
            <p>
              {Object.entries(rezept.zutat)
                .map(([id, n]) => `${n}× ${gegenstandById(id)?.name ?? id}`)
                .join(" + ")}{" "}
              → {rezept.ergebnisAnzahl}× {rezept.name}
            </p>
            <button
              type="button"
              className="mc-btn"
              onClick={() => {
                const ergebnis = craft(inventar, rezept.id)
                if (!ergebnis.ok) {
                  setMeldung(ergebnis.grund)
                  return
                }
                setzeInventar(ergebnis.inventar)
                setMeldung(`+${ergebnis.ergebnis.name}`)
              }}
            >
              Craft
            </button>
          </li>
        ))}
      </ul>
      {meldung ? <p>{meldung}</p> : null}
    </section>
  )
}
