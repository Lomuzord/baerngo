import { get } from "node:https"
import { BERN_KARTE } from "@/lib/karte"
import { mapboxToken } from "@/lib/mapboxToken"

export async function GET() {
  const token = mapboxToken()
  const { lng, lat, zoom, width, height } = BERN_KARTE
  const url =
    `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/` +
    `${lng},${lat},${zoom},0/${width}x${height}?access_token=${token}`

  console.info("karte: loading Mapbox static image from MAPBOX_TOKEN env")
  try {
    const { body, contentType } = await fetchMapboxImage(url)
    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    const status = error instanceof MapboxImageError ? error.status : 502
    console.error("karte: Mapbox static image failed", status)
    return new Response("Mapbox map could not be loaded", { status: 502 })
  }
}

class MapboxImageError extends Error {
  constructor(readonly status: number) {
    super("Mapbox image request failed")
  }
}

function fetchMapboxImage(
  url: string,
): Promise<{ body: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if ((res.statusCode ?? 500) >= 400) {
        res.resume()
        reject(new MapboxImageError(res.statusCode ?? 502))
        return
      }
      const chunks: Buffer[] = []
      res.on("data", (chunk) => chunks.push(chunk))
      res.on("end", () =>
        resolve({
          body: Buffer.concat(chunks),
          contentType: res.headers["content-type"] ?? "image/png",
        }),
      )
      res.on("error", reject)
    }).on("error", reject)
  })
}
