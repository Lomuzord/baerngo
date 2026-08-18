import { listSichtModelle } from "../lib/platzierung"

for (const modell of listSichtModelle()) {
  console.log(
    [
      modell.name,
      `id=${modell.id}`,
      `lat=${modell.lage.lat}`,
      `lng=${modell.lage.lng}`,
      `modell=${modell.modellId}`,
      `textur=${modell.textur}`,
    ].join("\t"),
  )
}
