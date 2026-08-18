import Link from "next/link"
import type { SehenswuerdigkeitKarte } from "@/lib/katalog"

export function SehenswuerdigkeitenList({
  sehenswuerdigkeiten,
}: {
  sehenswuerdigkeiten: SehenswuerdigkeitKarte[]
}) {
  return (
    <ul className="divide-y divide-stone-800 border-t border-stone-800">
      {sehenswuerdigkeiten.map((eintrag) => (
        <li key={eintrag.id}>
          <Link
            href={`/sehenswuerdigkeiten/${eintrag.id}`}
            className="flex items-end justify-between gap-4 px-4 py-5 hover:bg-stone-900"
          >
            <span className="max-w-[16ch] font-display text-4xl leading-none tracking-tight text-stone-50 sm:text-5xl">
              {eintrag.name}
            </span>
            <span className="shrink-0 pb-1 text-xs uppercase tracking-[0.18em] text-stone-400">
              Quiz
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
