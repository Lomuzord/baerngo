// Tageszeit-Tönung und Wetter für die Karte — die Spielwelt folgt
// der echten Uhrzeit und dem echten Berner Wetter.

export type Wetterart = "klar" | "regen" | "schnee"

export type HimmelTint = {
  farbe: string
  staerke: number
}

// Stunde als Dezimalzahl (z. B. 19.5 = 19:30)
export function tagesTint(stunde: number): HimmelTint {
  const s = ((stunde % 24) + 24) % 24
  // Nacht: 21:30–05:30 voll, weiche Übergänge davor/danach
  if (s >= 22 || s < 5.5) return { farbe: "#0a1440", staerke: 0.42 }
  if (s >= 5.5 && s < 6.5) {
    // Nacht → Morgenrot
    return { farbe: "#40206a", staerke: mische(0.42, 0.22, (s - 5.5) / 1) }
  }
  if (s >= 6.5 && s < 8) {
    return { farbe: "#ff9a3c", staerke: mische(0.22, 0, (s - 6.5) / 1.5) }
  }
  if (s >= 19 && s < 20.5) {
    return { farbe: "#ff7a32", staerke: mische(0, 0.24, (s - 19) / 1.5) }
  }
  if (s >= 20.5 && s < 22) {
    return { farbe: "#231a55", staerke: mische(0.24, 0.42, (s - 20.5) / 1.5) }
  }
  return { farbe: "#000000", staerke: 0 }
}

function mische(von: number, zu: number, anteil: number): number {
  const t = Math.min(1, Math.max(0, anteil))
  return von + (zu - von) * t
}

// Open-Meteo WMO-Codes: https://open-meteo.com/en/docs
export function wetterArt(code: number): Wetterart {
  if (!Number.isFinite(code)) return "klar"
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "schnee"
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code >= 95
  ) {
    return "regen"
  }
  return "klar"
}
