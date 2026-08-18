import Link from "next/link"
import type { SehenswuerdigkeitKarte } from "@/lib/katalog"
import { ressourceFuerSehenswuerdigkeit } from "@/lib/sammeln"
import { TruheFigur } from "./TruheFigur"

export function SehenswuerdigkeitKarte3D({
  eintrag,
}: {
  eintrag: SehenswuerdigkeitKarte
}) {
  const ressource = ressourceFuerSehenswuerdigkeit(eintrag.id)

  return (
    <Link
      href={`/sehenswuerdigkeiten/${eintrag.id}`}
      className="mc-card-link"
      aria-label={eintrag.name}
    >
      <article className="mc-card">
        <TruheFigur klasse="mc-truhe-karte" />
        <h2 className="mc-card-title">{eintrag.name}</h2>
        <p className="mc-card-loot">{ressource?.name ?? "???"}</p>
      </article>
    </Link>
  )
}
