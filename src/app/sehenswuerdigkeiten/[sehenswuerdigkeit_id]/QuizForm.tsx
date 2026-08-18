"use client"

import { useState } from "react"
import type { QuizOhneLoesung } from "@/lib/katalog"
import { submitAntwort, type SpielErgebnis } from "./actions"

export function QuizForm({
  sehenswuerdigkeitId,
  quiz,
  lat,
  lng,
  onKorrekt,
}: {
  sehenswuerdigkeitId: string
  quiz: QuizOhneLoesung
  lat: number
  lng: number
  onKorrekt: () => void
}) {
  const [ergebnis, setErgebnis] = useState<SpielErgebnis | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData) {
    const antwort = String(formData.get("antwort") ?? "")
    setPending(true)
    try {
      const danach = await submitAntwort(
        sehenswuerdigkeitId,
        antwort,
        lat,
        lng,
      )
      setErgebnis(danach)
      if (danach.art === "bewertet" && danach.korrekt) {
        onKorrekt()
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <p className="text-2xl leading-snug">{quiz.frage}</p>
      <fieldset className="flex flex-col gap-2" disabled={pending}>
        {quiz.optionen.map((option) => (
          <label key={option} className="mc-option">
            <input type="radio" name="antwort" value={option} required />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={pending} className="mc-btn">
        Antwort prüfen
      </button>
      {ergebnis ? <ErgebnisPanel ergebnis={ergebnis} /> : null}
    </form>
  )
}

function ErgebnisPanel({ ergebnis }: { ergebnis: SpielErgebnis }) {
  if (ergebnis.art === "zu-weit") {
    return <p>Noch {Math.round(ergebnis.distanzMeter)} m. Geh näher hin.</p>
  }
  if (!ergebnis.korrekt) {
    return <p>Leider falsch.</p>
  }
  return <p>Richtig. Die Truhe ist bereit.</p>
}
