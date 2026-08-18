"use client"

import { useState } from "react"
import type { QuizOhneLoesung } from "@/lib/katalog"
import { ressourceFuerSehenswuerdigkeit } from "@/lib/sammeln"
import { useInventar } from "../../useInventar"
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
  const { sammle } = useInventar()
  const ressource = ressourceFuerSehenswuerdigkeit(sehenswuerdigkeitId)

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
      if (danach.art === "bewertet" && danach.korrekt && ressource) {
        sammle(ressource.id)
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
      {ergebnis ? (
        <ErgebnisPanel ergebnis={ergebnis} ressourceName={ressource?.name} />
      ) : null}
    </form>
  )
}

function ErgebnisPanel({
  ergebnis,
  ressourceName,
}: {
  ergebnis: SpielErgebnis
  ressourceName?: string
}) {
  if (ergebnis.art === "zu-weit") {
    return <p>Noch {Math.round(ergebnis.distanzMeter)} m. Geh näher hin.</p>
  }
  if (!ergebnis.korrekt) {
    return <p>Leider falsch.</p>
  }
  return (
    <p>
      Richtig.
      {ressourceName ? ` +1 ${ressourceName}` : ""}
    </p>
  )
}
