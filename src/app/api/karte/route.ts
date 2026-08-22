import { BERN_KARTE } from "@/lib/karte"
import { mapboxToken } from "@/lib/mapboxToken"

export async function GET() {
  const token = mapboxToken()
  const { lng, lat, zoom, width, height } = BERN_KARTE
  const url =
    `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/` +
    `${lng},${lat},${zoom},0/${width}x${height}?access_token=${token}`

  console.info("karte: loading Mapbox static image from MAPBOX_TOKEN env")
  const antwort = await fetch(url)
  if (!antwort.ok) {
    console.error("karte: Mapbox static image failed", antwort.status)
    return new Response("Mapbox map could not be loaded", { status: 502 })
  }
  return new Response(antwort.body, {
    headers: {
      "Content-Type": antwort.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
