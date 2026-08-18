import { mapboxToken } from "@/lib/mapboxToken"

let cache: { token: string; until: number } | null = null

export async function GET() {
  console.info("karte: loading Mapbox GL from MAPBOX_TOKEN env")
  const secret = mapboxToken()
  if (cache && cache.until > Date.now()) {
    return Response.json({ accessToken: cache.token })
  }

  const user = mapboxUser(secret)
  const antwort = await fetch(
    `https://api.mapbox.com/tokens/v2/${user}?access_token=${secret}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: "baerngo-gl",
        scopes: ["styles:tiles", "styles:read", "fonts:read", "datasets:read"],
      }),
    },
  )
  if (!antwort.ok) {
    console.error("karte: could not mint public Mapbox token", antwort.status)
    return Response.json({ error: "mapbox session failed" }, { status: 502 })
  }
  const data = (await antwort.json()) as { token?: string }
  if (!data.token?.startsWith("pk.")) {
    return Response.json({ error: "mapbox session invalid" }, { status: 502 })
  }
  cache = { token: data.token, until: Date.now() + 50 * 60 * 1000 }
  return Response.json({ accessToken: data.token })
}

function mapboxUser(token: string): string {
  const payload = token.split(".")[1]
  if (!payload) throw new Error("MAPBOX_TOKEN is not a JWT")
  const json = JSON.parse(
    Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
  ) as { u?: string }
  if (!json.u) throw new Error("MAPBOX_TOKEN has no username")
  return json.u
}
