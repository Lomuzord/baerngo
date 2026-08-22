import { listSehenswuerdigkeiten } from "../lib/katalog"
import { ressourceFuerSehenswuerdigkeit } from "../lib/sammeln"

for (const eintrag of listSehenswuerdigkeiten()) {
  const fragen = eintrag.quizze.length
  const alias = eintrag.alias.length ? ` (${eintrag.alias.join(", ")})` : ""
  const ressource = ressourceFuerSehenswuerdigkeit(eintrag.id)
  console.log(
    `${eintrag.name}${alias}\tfragen=${fragen}\tressource=${ressource?.name ?? "none"}`,
  )
}
