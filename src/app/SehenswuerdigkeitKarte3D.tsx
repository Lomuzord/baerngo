import type { CSSProperties } from "react"
import Link from "next/link"
import type { SehenswuerdigkeitKarte } from "@/lib/katalog"
import { ressourceFuerSehenswuerdigkeit } from "@/lib/sammeln"

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
        <div
          className="mc-cube"
          style={
            {
              "--block": "#8b5a2b",
              backgroundImage: ressource
                ? `url(${ressource.textur})`
                : undefined,
            } as CSSProperties
          }
        />
        <h2 className="mc-card-title">{eintrag.name}</h2>
        <p className="mc-card-loot">{ressource?.name ?? "???"}</p>
      </article>
    </Link>
  )
}
