"use client"

import { useEffect, useRef, useState } from "react"
import type { QuizOhneLoesung } from "@/lib/katalog"
import { spieleHaptik } from "@/lib/haptik"
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
  const timer = useRef<number>(0)

  useEffect(() => {
    return () => window.clearTimeout(timer.current)
  }, [])

  async function onSubmit(formData: FormData) {
    const antwort = String(formData.get("antwort") ?? "")
    setPending(true)
    try {
      const danach = await submitAntwort(
        sehenswuerdigkeitId,
        quiz.frageId,
        antwort,
        lat,
        lng,
      )
      setErgebnis(danach)
      if (danach.art === "zu-weit") {
        spieleHaptik("zu-weit")
        setPending(false)
      } else if (danach.art === "bewertet" && danach.korrekt) {
        spieleHaptik("richtig")
        // Das "Richtig" kurz stehen lassen, bevor die Truhe erscheint —
        // sonst verschwindet das Formular im selben Frame.
        timer.current = window.setTimeout(onKorrekt, 1100)
      } else {
        spieleHaptik("falsch")
        setPending(false)
      }
    } catch {
      setPending(false)
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <p className="text-2xl leading-snug">{quiz.frage}</p>
      <fieldset className="flex flex-col gap-2" disabled={pending}>
        {quiz.optionen.map((option) => (
          <label key={option} className="mc-option" data-haptik="wahl">
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
