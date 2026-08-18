import { Suspense } from "react"
import { listSehenswuerdigkeitenFuerKarte } from "@/lib/katalog"
import { Spielwelt } from "./Spielwelt"

export default function Home() {
  return (
    <Suspense fallback={<main className="mc-world" />}>
      <Spielwelt sehenswuerdigkeiten={listSehenswuerdigkeitenFuerKarte()} />
    </Suspense>
  )
}
