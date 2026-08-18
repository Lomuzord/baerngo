"use client"

import { useState } from "react"
import type { QuizOhneLoesung } from "@/lib/katalog"
import { submitAntwort, type SpielErgebnis } from "./actions"

export function QuizForm({
  sehenswuerdigkeitId,
  quiz,
  lat,
  lng,
}: {
  sehenswuerdigkeitId: string
  quiz: QuizOhneLoesung
  lat: number
  lng: number
}) {
  const [ergebnis, setErgebnis] = useState<SpielErgebnis | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData) {
    const antwort = String(formData.get("antwort") ?? "")
    setPending(true)
    try {
      setErgebnis(await submitAntwort(sehenswuerdigkeitId, antwort, lat, lng))
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <p className="text-xl leading-snug text-stone-100">{quiz.frage}</p>
      <fieldset className="flex flex-col gap-2" disabled={pending}>
        {quiz.optionen.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-start gap-3 border border-stone-700 bg-stone-900 px-3 py-3 text-stone-100 has-[:checked]:border-red-700"
          >
            <input
              type="radio"
              name="antwort"
              value={option}
              required
              className="mt-1 accent-red-700"
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <button
        type="submit"
        disabled={pending}
        className="bg-red-700 px-4 py-3 text-sm uppercase tracking-[0.18em] text-stone-50 disabled:opacity-60"
      >
        Antwort prüfen
      </button>
      {ergebnis ? <ErgebnisPanel ergebnis={ergebnis} /> : null}
    </form>
  )
}

function ErgebnisPanel({ ergebnis }: { ergebnis: SpielErgebnis }) {
  if (ergebnis.art === "zu-weit") {
    return (
      <p className="text-stone-300">
        Noch {Math.round(ergebnis.distanzMeter)} m. Geh näher hin.
      </p>
    )
  }
  return (
    <p className={ergebnis.korrekt ? "text-emerald-400" : "text-red-400"}>
      {ergebnis.korrekt ? "Richtig." : "Leider falsch."}
    </p>
  )
}
