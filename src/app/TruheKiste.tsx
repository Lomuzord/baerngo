"use client"

import type { Gegenstand } from "@/lib/gegenstaende"
import type { TruheStatus } from "@/lib/truhe"
import { Block3D } from "./Block3D"
import { TruheFigur } from "./TruheFigur"

export function TruheKiste({
  status,
  ressource,
  onOeffnen,
}: {
  status: Exclude<TruheStatus, "verschlossen">
  ressource: Gegenstand
  onOeffnen: () => void
}) {
  const offen = status === "geleert"

  return (
    <div className="mc-loot">
      <button
        type="button"
        className="mc-truhe-btn"
        onClick={offen ? undefined : onOeffnen}
        disabled={offen}
        aria-label={
          offen
            ? `Truhe leer, ${ressource.name} eingesammelt`
            : `${ressource.name}-Truhe öffnen`
        }
      >
        <TruheFigur offen={offen} bereit={!offen} klasse="mc-truhe-gross" />
        {offen ? (
          <span className="mc-loot-item">
            <Block3D textur={ressource.textur} />
          </span>
        ) : null}
      </button>
      <p className="mc-card-loot">
        {offen ? `+1 ${ressource.name}` : "Tippe die Truhe"}
      </p>
    </div>
  )
}
