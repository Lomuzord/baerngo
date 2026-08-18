import { listSehenswuerdigkeiten } from "../lib/katalog"

for (const eintrag of listSehenswuerdigkeiten()) {
  const hatQuiz =
    eintrag.quiz.frage.length > 0 && eintrag.quiz.optionen.length > 0
  const alias = eintrag.alias.length ? ` (${eintrag.alias.join(", ")})` : ""
  console.log(`${eintrag.name}${alias}\tquiz=${hatQuiz ? "yes" : "no"}`)
}
