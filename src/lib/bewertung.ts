import { sehenswuerdigkeitById } from "./katalog"

export type Bewertung = {
  korrekt: boolean
}

export function bewerteAntwort(
  sehenswuerdigkeitId: string,
  antwort: string,
): Bewertung {
  const sehenswuerdigkeit = sehenswuerdigkeitById(sehenswuerdigkeitId)
  if (!sehenswuerdigkeit) {
    return { korrekt: false }
  }
  return { korrekt: sehenswuerdigkeit.quiz.richtigeAntwort === antwort }
}
