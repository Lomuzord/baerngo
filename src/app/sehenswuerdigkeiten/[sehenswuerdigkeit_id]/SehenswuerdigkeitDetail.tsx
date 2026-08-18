"use client"

import Link from "next/link"
import { istInReichweite } from "@/lib/reichweite"
import type { QuizOhneLoesung } from "@/lib/katalog"
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
  const reichweite =
    spieler.status === "bereit" ? istInReichweite(spieler.lage, id) : null

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-8 px-4 py-8">
      <Link
        href="/"
        className="text-xs uppercase tracking-[0.18em] text-stone-400"
      >
        ← Karte
      </Link>
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-red-700">
          Sehenswürdigkeit
        </p>
        <h1 className="mt-2 font-display text-5xl leading-[0.9] tracking-tight text-stone-50 sm:text-6xl">
          {name}
        </h1>
        {alias.length > 0 ? (
          <p className="mt-3 text-stone-400">{alias.join(" · ")}</p>
        ) : null}
      </header>

      {spieler.status === "suche" ? (
        <p className="text-stone-300">Standort wird gesucht…</p>
      ) : null}
      {spieler.status === "verweigert" ? (
        <p className="text-stone-300">
          Ohne Standort kein Quiz. Erlaube den Ort und geh zur Sehenswürdigkeit.
        </p>
      ) : null}
      {spieler.status === "fehler" ? (
        <p className="text-stone-300">
          Standort nicht verfügbar. Das Quiz geht nur vor Ort.
        </p>
      ) : null}
      {reichweite && !reichweite.erlaubt ? (
        <p className="text-lg text-stone-200">
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
