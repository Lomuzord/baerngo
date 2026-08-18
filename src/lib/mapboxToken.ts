export function mapboxToken(): string {
  const token = process.env.MAPBOX_TOKEN ?? process.env.MAPBOX_ACCESS_TOKEN
  if (!token) {
    throw new Error(
      "MAPBOX_TOKEN is missing. Copy .env.example to .env.local and set the Mapbox token.",
    )
  }
  return token
}
