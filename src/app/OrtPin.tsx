export function OrtPin({
  aktiv = false,
  klasse,
}: {
  aktiv?: boolean
  klasse?: string
}) {
  return (
    <span
      className={`mc-ort-pin ${aktiv ? "mc-ort-pin-aktiv" : ""} ${klasse ?? ""}`.trim()}
      aria-hidden
    >
      <span className="mc-ort-pin-raute" />
      <span className="mc-ort-pin-stiel" />
    </span>
  )
}
