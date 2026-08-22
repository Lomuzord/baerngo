"use client"

import {
  formatiereBeute,
  type Beute,
} from "@/lib/sammeln"
import { spieleHaptik } from "@/lib/haptik"
import { formatiereTruhePause, type TruheStatus } from "@/lib/truhe"
import { Block3D } from "./Block3D"
import { Truhe3D } from "./Truhe3D"

export function TruheKiste({
  status,
  beute,
  pauseRestMs,
  onOeffnen,
}: {
  status: Exclude<TruheStatus, "verschlossen">
  beute: Beute[]
  pauseRestMs: number
  onOeffnen: () => void
}) {
  const offen = status === "geleert"
  const bereit = status === "bereit"
  const titel = formatiereBeute(beute)

  return (
    <div className="mc-loot">
      <button
        type="button"
        className="mc-truhe-btn"
        data-haptik="aus"
        onClick={() => {
          spieleHaptik(offen ? "rattle" : "truhe")
          onOeffnen()
        }}
        aria-label={
          offen
            ? pauseRestMs > 0
              ? `Truhe leer, nächste in ${formatiereTruhePause(pauseRestMs)}`
              : `Truhe leer, ${titel} eingesammelt`
            : "Truhe öffnen"
        }
      >
        <Truhe3D offen={offen} bereit={bereit} />
        {offen ? (
          <span className="mc-loot-stapel">
            {beute.map((stuck) => (
                <span key={stuck.gegenstandId} className="mc-loot-item">
                  <Block3D gegenstandId={stuck.gegenstandId} />
                  <span className="mc-loot-zahl">{stuck.anzahl}</span>
                </span>
            ))}
          </span>
        ) : null}
      </button>
      <p className="mc-card-loot">
        {offen
          ? pauseRestMs > 0
            ? `${titel} · wieder in ${formatiereTruhePause(pauseRestMs)}`
            : titel
          : "Tippe die Truhe"}
      </p>
    </div>
  )
}
