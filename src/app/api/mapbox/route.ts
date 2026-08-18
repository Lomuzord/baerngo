import { mapboxToken } from "@/lib/mapboxToken"

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u")
  if (!raw) {
    return new Response("missing url", { status: 400 })
  }

  let ziel: URL
  try {
    ziel = new URL(raw)
  } catch {
    return new Response("bad url", { status: 400 })
  }

  if (!istMapboxHost(ziel.hostname)) {
    return new Response("forbidden host", { status: 403 })
  }

  const token = mapboxToken()
  ziel.searchParams.set("access_token", token)

  if (ziel.pathname.includes("/styles/")) {
    console.info("karte: loading Mapbox GL from MAPBOX_TOKEN env")
  }

  const antwort = await fetch(ziel)
  const headers = new Headers()
  const typ = antwort.headers.get("content-type")
  if (typ) headers.set("Content-Type", typ)
  headers.set("Cache-Control", "public, max-age=3600")
  return new Response(antwort.body, { status: antwort.status, headers })
}

function istMapboxHost(host: string): boolean {
  return (
    host === "api.mapbox.com" ||
    host.endsWith(".tiles.mapbox.com") ||
    host === "events.mapbox.com"
  )
}
