import type { Lage, SehenswuerdigkeitKarte } from "@/lib/katalog"
import { fotoFuerSehenswuerdigkeit } from "@/lib/fotos"
import { meshFuerSehenswuerdigkeit } from "@/lib/modelle"
import { entfernungText, istInReichweite } from "@/lib/reichweite"
import { ModellBuehne } from "./ModellBuehne"
import { OrtPin } from "./OrtPin"

export function SehenswuerdigkeitKarte3D({
  eintrag,
  spielerLage,
  gewaehlt,
  onWaehle,
}: {
  eintrag: SehenswuerdigkeitKarte
  spielerLage: Lage | null
  gewaehlt: boolean
  onWaehle: (id: string) => void
}) {
  const foto = fotoFuerSehenswuerdigkeit(eintrag.id)
  const mesh = meshFuerSehenswuerdigkeit(eintrag.id)
  const reichweite = istInReichweite(spielerLage, eintrag.id)

  return (
    <button
      type="button"
      className="mc-card-link"
      aria-label={eintrag.name}
      aria-pressed={gewaehlt}
      onClick={() => onWaehle(eintrag.id)}
    >
      <article className={`mc-card ${gewaehlt ? "mc-card-aktiv" : ""}`}>
        <OrtPin aktiv={gewaehlt} klasse="mc-ort-pin-karte" />
        {mesh ? (
          <ModellBuehne mesh={mesh} klasse="mc-modell-liste" />
        ) : foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="mc-card-foto"
            src={foto.src}
            alt=""
            width={220}
            height={140}
          />
        ) : null}
        <h2 className="mc-card-title">{eintrag.name}</h2>
        <p className="mc-card-loot">
          {spielerLage ? entfernungText(reichweite.distanzMeter) : "—"}
        </p>
      </article>
    </button>
  )
}
