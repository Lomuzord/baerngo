import type { CSSProperties } from "react"

export function Block3D({
  textur,
  className,
}: {
  textur?: string
  className?: string
}) {
  const face = textur
    ? ({ backgroundImage: `url(${textur})` } as CSSProperties)
    : undefined

  return (
    <span className={`mc-iso ${className ?? ""}`.trim()}>
      <span className="mc-face mc-face-front" style={face} />
      <span className="mc-face mc-face-side" style={face} />
      <span className="mc-face mc-face-top" style={face} />
    </span>
  )
}
