import { listSehenswuerdigkeitenFuerKarte } from "@/lib/katalog"
import { BernKarte } from "./BernKarte"
import { SehenswuerdigkeitenList } from "./SehenswuerdigkeitenList"

export default function Home() {
  const sehenswuerdigkeiten = listSehenswuerdigkeitenFuerKarte()

  return (
    <main className="min-h-dvh bg-stone-950 text-stone-50">
      <header className="flex items-end justify-between px-4 pb-4 pt-8">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-red-700">
            Bern
          </p>
          <h1 className="font-display text-6xl leading-none tracking-tight sm:text-7xl">
            bärngo
          </h1>
        </div>
        <p className="max-w-[18ch] pb-1 text-right text-xs uppercase tracking-[0.16em] text-stone-400">
          Geh hin. Antworte vor Ort.
        </p>
      </header>
      <BernKarte sehenswuerdigkeiten={sehenswuerdigkeiten} />
      <SehenswuerdigkeitenList sehenswuerdigkeiten={sehenswuerdigkeiten} />
    </main>
  )
}
