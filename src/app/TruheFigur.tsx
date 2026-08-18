export function TruheFigur({
  offen = false,
  bereit = false,
  klasse,
}: {
  offen?: boolean
  bereit?: boolean
  klasse?: string
}) {
  const zustand = offen
    ? "mc-truhe-offen"
    : bereit
      ? "mc-truhe-bereit"
      : ""

  return (
    <span className={`mc-truhe ${zustand} ${klasse ?? ""}`.trim()}>
      <span className="mc-truhe-scene">
        <span className="mc-truhe-deckel" aria-hidden>
          <span className="mc-face mc-face-front" />
          <span className="mc-face mc-face-side" />
          <span className="mc-face mc-face-top" />
        </span>
        <span className="mc-truhe-korpus" aria-hidden>
          <span className="mc-face mc-face-front" />
          <span className="mc-face mc-face-side" />
          <span className="mc-face mc-face-top" />
        </span>
        <span className="mc-truhe-riegel" aria-hidden />
      </span>
    </span>
  )
}
