"use client"

import Link from "next/link"
import { istInReichweite } from "@/lib/reichweite"
import type { QuizOhneLoesung } from "@/lib/katalog"
import { meshFuerSehenswuerdigkeit } from "@/lib/modelle"
import { ressourceFuerSehenswuerdigkeit } from "@/lib/sammeln"
import { truheStatus } from "@/lib/truhe"
import { InventarLeiste } from "../../InventarLeiste"
import { TruheKiste } from "../../TruheKiste"
import { useInventar } from "../../useInventar"
import { useSpielerOrt } from "../../useSpielerOrt"
import { useTruhen } from "../../useTruhen"
import { ModellBuehne } from "../../ModellBuehne"
import { QuizForm } from "./QuizForm"

export function SehenswuerdigkeitDetail({
  id,
  name,
  alias,
  quiz,
}: {
  id: string
  name: string
  alias: string[]
  quiz: QuizOhneLoesung
}) {
  const spieler = useSpielerOrt()
  const { inventar, sammle } = useInventar()
  const { stand, entsperre, oeffne } = useTruhen()
  const reichweite =
    spieler.status === "bereit" ? istInReichweite(spieler.lage, id) : null
  const ressource = ressourceFuerSehenswuerdigkeit(id)
  const mesh = meshFuerSehenswuerdigkeit(id)
  const truhe = truheStatus(stand, id)
  const vorOrt = spieler.status === "bereit" && Boolean(reichweite?.erlaubt)

  return (
    <main className="mc-panel">
      <InventarLeiste inventar={inventar} />
      <Link href="/" className="mc-back">
        ← Karte
      </Link>
      <header>
        <p className="mc-kicker">Ort</p>
        <h1 className="mc-title">{name}</h1>
        {alias.length > 0 ? <p className="mc-tagline">{alias.join(" · ")}</p> : null}
        {ressource ? (
          <p className="mc-card-loot">Truhe: {ressource.name}</p>
        ) : null}
      </header>
      {mesh ? <ModellBuehne mesh={mesh} klasse="mc-modell-detail" /> : null}

      {spieler.status === "suche" ? <p>Standort wird gesucht…</p> : null}
      {spieler.status === "verweigert" ? (
        <p>Ohne Standort kein Quiz. Erlaube den Ort und geh hin.</p>
      ) : null}
      {spieler.status === "fehler" ? (
        <p>Standort nicht verfügbar. Das Quiz geht nur vor Ort.</p>
      ) : null}
      {reichweite && !reichweite.erlaubt ? (
        <p>
          Noch {Math.round(reichweite.distanzMeter)} m. Geh zum {name}.
        </p>
      ) : null}
      {spieler.status === "bereit" &&
      reichweite?.erlaubt &&
      truhe === "verschlossen" ? (
        <QuizForm
          sehenswuerdigkeitId={id}
          quiz={quiz}
          lat={spieler.lage.lat}
          lng={spieler.lage.lng}
          onKorrekt={() => entsperre(id)}
        />
      ) : null}
      {vorOrt && ressource && truhe !== "verschlossen" ? (
        <TruheKiste
          status={truhe}
          ressource={ressource}
          onOeffnen={() => {
            if (oeffne(id)) sammle(ressource.id)
          }}
        />
      ) : null}
    </main>
  )
}
