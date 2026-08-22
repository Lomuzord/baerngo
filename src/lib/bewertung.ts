import { quizFrage } from "./katalog"

export type Bewertung = {
  korrekt: boolean
}

export function bewerteAntwort(
  sehenswuerdigkeitId: string,
  frageId: number,
  antwort: string,
): Bewertung {
  const quiz = quizFrage(sehenswuerdigkeitId, frageId)
  if (!quiz) {
    return { korrekt: false }
  }
  return { korrekt: quiz.richtigeAntwort === antwort }
}
