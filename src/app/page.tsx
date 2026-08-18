import { listSehenswuerdigkeitenFuerKarte } from "@/lib/katalog"
import { Spielwelt } from "./Spielwelt"

export default function Home() {
  return (
    <Spielwelt sehenswuerdigkeiten={listSehenswuerdigkeitenFuerKarte()} />
  )
}
