"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { fotoFuerSehenswuerdigkeit } from "@/lib/fotos"
import { istInReichweite } from "@/lib/reichweite"
import type { QuizOhneLoesung } from "@/lib/katalog"
import {
  beuteFuerSehenswuerdigkeit,
  formatiereBeute,
} from "@/lib/sammeln"
import { InventarLeiste } from "../../InventarLeiste"
import { TruheKiste } from "../../TruheKiste"
import { useInventar } from "../../useInventar"
import { useSpielerOrt } from "../../useSpielerOrt"
import { useTruhen } from "../../useTruhen"
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
  const router = useRouter()
  const spieler = useSpielerOrt()
  const { slots, sammleBeute } = useInventar()
  const { statusFuer, restMsFuer, entsperre, oeffne } = useTruhen()
  const reichweite =
    spieler.status === "bereit" ? istInReichweite(spieler.lage, id) : null
  const beute = beuteFuerSehenswuerdigkeit(id)
  const foto = fotoFuerSehenswuerdigkeit(id)
  const truhe = statusFuer(id)
  const pauseRestMs = restMsFuer(id)
  const vorOrt = spieler.status === "bereit" && Boolean(reichweite?.erlaubt)

  return (
    <main className="mc-panel">
      <InventarLeiste slots={slots} />
      <Link href="/" className="mc-back">
        ← Karte
      </Link>
      <header>
        <p className="mc-kicker">Ort</p>
        <h1 className="mc-title">{name}</h1>
        {alias.length > 0 ? <p className="mc-tagline">{alias.join(" · ")}</p> : null}
        {beute.length > 0 ? (
          <p className="mc-card-loot">Truhe: {formatiereBeute(beute)}</p>
        ) : null}
      </header>
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="mc-detail-foto"
          src={foto.src}
          alt=""
          width={640}
          height={360}
        />
      ) : null}

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
          onKorrekt={() => {
            entsperre(id)
            // Neue Zufallsfrage vom Server holen, damit beim nächsten
            // Besuch nicht dieselbe Frage festhängt
            router.refresh()
          }}
        />
      ) : null}
      {vorOrt && beute.length > 0 && truhe !== "verschlossen" ? (
        <TruheKiste
          status={truhe}
          beute={beute}
          pauseRestMs={pauseRestMs}
          onOeffnen={() => {
            if (oeffne(id)) {
              sammleBeute(beute)
            }
          }}
        />
      ) : null}
    </main>
  )
}
