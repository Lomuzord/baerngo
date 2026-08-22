import { spieleKlang } from "./klang"

export const HAPTIK_ARTEN = [
  "tipp",
  "wahl",
  "sammeln",
  "truhe",
  "rattle",
  "richtig",
  "falsch",
  "setzen",
  "abbauen",
  "zerbrochen",
  "zu-weit",
  "craft",
  "ar",
] as const

export type HaptikArt = (typeof HAPTIK_ARTEN)[number]

const MUSTER: Record<HaptikArt, number | number[]> = {
  tipp: 10,
  wahl: 14,
  sammeln: [16, 28, 28],
  truhe: [20, 35, 28, 35, 55],
  rattle: [8, 18, 8, 18, 10],
  richtig: [18, 32, 42],
  falsch: [42, 28, 18],
  setzen: 18,
  abbauen: [12, 18, 28],
  zerbrochen: [28, 32, 48, 36, 72],
  "zu-weit": [10, 36, 10],
  craft: [16, 24, 22, 24, 40],
  ar: [14, 26, 22],
}

export function spieleHaptik(art: HaptikArt) {
  spieleKlang(art)
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return false
  }
  try {
    return navigator.vibrate(MUSTER[art])
  } catch {
    return false
  }
}

export function haptikArtVonZiel(ziel: EventTarget | null): HaptikArt | null {
  if (!(ziel instanceof Element)) return null
  const knopf = ziel.closest(
    "button, a.mc-tab, a.mc-btn, a.mc-back, a.mc-ort-karte-link, label.mc-option, [data-haptik]",
  )
  if (!(knopf instanceof HTMLElement)) return null
  if (knopf.getAttribute("data-haptik") === "aus") return null
  const extra = knopf.getAttribute("data-haptik")
  if (extra && istHaptikArt(extra)) return extra
  if (knopf.classList.contains("mc-slot")) return "wahl"
  if (knopf.classList.contains("mc-tab")) return "tipp"
  return "tipp"
}

export function istHaptikArt(wert: string): wert is HaptikArt {
  return (HAPTIK_ARTEN as readonly string[]).includes(wert)
}
