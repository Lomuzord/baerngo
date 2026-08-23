// Verdeckung in AR ("depth sensing"): Das Handy schätzt für jeden
// Bildpunkt, wie weit die echte Welt entfernt ist. Damit verschwinden
// Blöcke hinter echten Menschen, Wänden und Möbeln, statt immer
// obenauf zu kleben.
//
// Wichtig: Wir holen die Tiefe bewusst über den CPU-Weg. three.js
// bringt zwar einen eigenen GPU-Weg mit, der ist aber auf die
// Quest-Brille zugeschnitten (Textur-Array, fertig normierte Tiefe).
// ARCore auf Android liefert eine einfache 2D-Textur mit Millimetern
// in zwei Bytes — three würde daraus Unsinn machen und im schlimmsten
// Fall ALLE Blöcke wegschneiden. Mit "cpu-optimized" bleibt three
// garantiert unbeteiligt und wir rechnen selbst sauber.

export function tiefenOptionen(): {
  usagePreference: string[]
  dataFormatPreference: string[]
  matchDepthView: boolean
} {
  return {
    usagePreference: ["cpu-optimized"],
    dataFormatPreference: ["luminance-alpha"],
    // Tiefenbild soll zur Blickrichtung passen
    matchDepthView: true,
  }
}

type TiefenSitzung = {
  enabledFeatures?: readonly string[]
  depthUsage?: string
  depthDataFormat?: string
}

// Liefert das Gerät wirklich Tiefe — und in der Form, die wir lesen?
export function tiefeMoeglich(sitzung: TiefenSitzung | null): boolean {
  if (!sitzung) return false
  const merkmale = sitzung.enabledFeatures
  if (!merkmale || !merkmale.includes("depth-sensing")) return false
  return sitzung.depthUsage === "cpu-optimized"
}

// ARCore packt Millimeter in zwei Bytes: unteres Byte, oberes Byte.
// Beide kommen aus der Textur als 0..1 normierte Werte zurück.
export function tiefeInMetern(
  unten: number,
  oben: number,
  rohZuMeter: number,
): number {
  return (unten * 255 + oben * 255 * 256) * rohZuMeter
}

// Wie viel näher die echte Welt sein muss, damit wir wegschneiden.
// Der Messfehler wächst mit der Entfernung: nah ist die Schätzung auf
// wenige Zentimeter genau, in fünf Metern schwankt sie deutlich mehr.
// Darum ein Anteil der Entfernung statt eines festen Werts — sonst
// schneidet eine Platte, die auf dem Boden liegt, sich selbst löchrig,
// oder sie deckt umgekehrt die Füsse einer Person zu.
export const TIEFE_TOLERANZ_ANTEIL = 0.04
export const TIEFE_TOLERANZ_MIN = 0.05
export const TIEFE_TOLERANZ_MAX = 0.35

export function tiefeToleranz(echtMeter: number): number {
  return Math.min(
    TIEFE_TOLERANZ_MAX,
    Math.max(TIEFE_TOLERANZ_MIN, echtMeter * TIEFE_TOLERANZ_ANTEIL),
  )
}

export function tiefeVerdeckt(echtMeter: number, blockMeter: number): boolean {
  // 0 heisst "keine Messung" — dann lieber zeichnen als fälschlich
  // alles wegschneiden.
  if (!(echtMeter > 0.05)) return false
  return echtMeter < blockMeter - tiefeToleranz(echtMeter)
}

export function tiefeHinweis(moeglich: boolean, an: boolean): string {
  if (!moeglich) {
    return "Dieses Gerät liefert keine Tiefendaten — Verdeckung nicht möglich."
  }
  return an
    ? "Verdeckung an: Blöcke verschwinden hinter echten Dingen."
    : "Verdeckung aus: Blöcke liegen über dem Kamerabild."
}
