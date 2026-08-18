"use client"

import Link from "next/link"
import { istInReichweite } from "@/lib/reichweite"
import type { QuizOhneLoesung } from "@/lib/katalog"
import { ressourceFuerSehenswuerdigkeit } from "@/lib/sammeln"
import { InventarLeiste } from "../../InventarLeiste"
import { useInventar } from "../../useInventar"
import { useSpielerOrt } from "../../useSpielerOrt"
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
  const { inventar } = useInventar()
  const reichweite =
    spieler.status === "bereit" ? istInReichweite(spieler.lage, id) : null
  const ressource = ressourceFuerSehenswuerdigkeit(id)

  return (
    <main className="mc-panel">
      <InventarLeiste inventar={inventar} />
      <Link href="/" className="mc-back">
        ← Karte
      </Link>
      <header>
        <p className="mc-kicker">Sehenswürdigkeit</p>
        <h1 className="mc-title">{name}</h1>
        {alias.length > 0 ? <p className="mc-tagline">{alias.join(" · ")}</p> : null}
        {ressource ? (
          <p className="mc-card-loot">Belohnung: {ressource.name}</p>
        ) : null}
      </header>

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
      {spieler.status === "bereit" && reichweite?.erlaubt ? (
        <QuizForm
          sehenswuerdigkeitId={id}
          quiz={quiz}
          lat={spieler.lage.lat}
          lng={spieler.lage.lng}
        />
      ) : null}
    </main>
  )
}
