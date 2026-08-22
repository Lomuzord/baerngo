import type { HaptikArt } from "./haptik"

// Synthesierte Spielgeräusche über WebAudio — keine Audiodateien nötig.
// Wird immer aus einer Nutzergeste heraus aufgerufen (gleiche Stelle wie
// die Haptik), darum darf der AudioContext hier entstehen/weiterlaufen.

const TON_SPEICHER = "baerngo-ton"

let ctx: AudioContext | null = null

export function tonAn(): boolean {
  if (typeof window === "undefined") return true
  return window.localStorage.getItem(TON_SPEICHER) !== "aus"
}

export function schalteTon(): boolean {
  const danach = !tonAn()
  window.localStorage.setItem(TON_SPEICHER, danach ? "an" : "aus")
  return danach
}

function kontext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const AC =
    window.AudioContext ??
    (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  try {
    if (!ctx) ctx = new AC()
    if (ctx.state === "suspended") {
      // iOS kann resume() ablehnen, wenn die Geste nicht zählt —
      // still schlucken, der nächste Tipp versucht es erneut.
      void ctx.resume().catch(() => {})
    }
    return ctx
  } catch {
    return null
  }
}

type TonOptionen = {
  f: number
  bis?: number
  t?: number
  dauer: number
  typ?: OscillatorType
  gain?: number
}

function ton(ac: AudioContext, optionen: TonOptionen) {
  const { f, bis = f, t = 0, dauer, typ = "sine", gain = 0.1 } = optionen
  const start = ac.currentTime + t
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = typ
  o.frequency.setValueAtTime(Math.max(1, f), start)
  if (bis !== f) {
    o.frequency.exponentialRampToValueAtTime(Math.max(1, bis), start + dauer)
  }
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.0008, start + dauer)
  o.connect(g)
  g.connect(ac.destination)
  o.start(start)
  o.stop(start + dauer + 0.02)
}

type RauschOptionen = {
  t?: number
  dauer: number
  gain?: number
  tiefpass?: number
}

function rauschen(ac: AudioContext, optionen: RauschOptionen) {
  const { t = 0, dauer, gain = 0.09, tiefpass = 900 } = optionen
  const laenge = Math.max(1, Math.ceil(ac.sampleRate * dauer))
  const puffer = ac.createBuffer(1, laenge, ac.sampleRate)
  const daten = puffer.getChannelData(0)
  for (let i = 0; i < laenge; i++) daten[i] = Math.random() * 2 - 1
  const quelle = ac.createBufferSource()
  quelle.buffer = puffer
  const filter = ac.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.value = tiefpass
  const g = ac.createGain()
  const start = ac.currentTime + t
  g.gain.setValueAtTime(gain, start)
  g.gain.exponentialRampToValueAtTime(0.0008, start + dauer)
  quelle.connect(filter)
  filter.connect(g)
  g.connect(ac.destination)
  quelle.start(start)
  quelle.stop(start + dauer + 0.02)
}

export function spieleKlang(art: HaptikArt) {
  if (!tonAn()) return
  const ac = kontext()
  if (!ac) return
  switch (art) {
    case "tipp":
      ton(ac, { f: 340, dauer: 0.04, typ: "square", gain: 0.035 })
      break
    case "wahl":
      ton(ac, { f: 420, dauer: 0.05, typ: "square", gain: 0.04 })
      break
    case "sammeln":
      // Das Minecraft-"Plopp" beim Aufsammeln
      ton(ac, { f: 520, bis: 1040, dauer: 0.09, gain: 0.09 })
      ton(ac, { f: 780, bis: 1560, t: 0.05, dauer: 0.08, gain: 0.06 })
      break
    case "setzen":
      ton(ac, { f: 170, dauer: 0.07, typ: "triangle", gain: 0.12 })
      rauschen(ac, { dauer: 0.05, gain: 0.05, tiefpass: 1400 })
      break
    case "abbauen":
      rauschen(ac, { dauer: 0.09, gain: 0.1, tiefpass: 1100 })
      ton(ac, { f: 140, bis: 90, dauer: 0.08, typ: "triangle", gain: 0.07 })
      break
    case "zerbrochen":
      rauschen(ac, { dauer: 0.16, gain: 0.12, tiefpass: 2400 })
      ton(ac, { f: 300, bis: 90, dauer: 0.22, typ: "sawtooth", gain: 0.06 })
      break
    case "craft":
      ton(ac, { f: 200, dauer: 0.06, typ: "triangle", gain: 0.1 })
      ton(ac, { f: 260, t: 0.09, dauer: 0.06, typ: "triangle", gain: 0.1 })
      rauschen(ac, { t: 0.16, dauer: 0.06, gain: 0.05, tiefpass: 1800 })
      break
    case "truhe":
      ton(ac, { f: 90, bis: 160, dauer: 0.25, typ: "sawtooth", gain: 0.05 })
      rauschen(ac, { dauer: 0.12, gain: 0.04, tiefpass: 500 })
      break
    case "rattle":
      for (const t of [0, 0.06, 0.12]) {
        rauschen(ac, { t, dauer: 0.03, gain: 0.06, tiefpass: 1600 })
      }
      break
    case "richtig":
      // Aufsteigender Dur-Dreiklang wie beim Levelup
      ton(ac, { f: 523, dauer: 0.1, gain: 0.09 })
      ton(ac, { f: 659, t: 0.09, dauer: 0.1, gain: 0.09 })
      ton(ac, { f: 784, t: 0.18, dauer: 0.16, gain: 0.1 })
      break
    case "falsch":
      ton(ac, { f: 220, bis: 180, dauer: 0.16, typ: "square", gain: 0.06 })
      ton(ac, { f: 165, bis: 140, t: 0.12, dauer: 0.18, typ: "square", gain: 0.06 })
      break
    case "zu-weit":
      ton(ac, { f: 240, dauer: 0.07, typ: "square", gain: 0.05 })
      ton(ac, { f: 240, t: 0.12, dauer: 0.07, typ: "square", gain: 0.05 })
      break
    case "ar":
      ton(ac, { f: 300, bis: 900, dauer: 0.22, gain: 0.07 })
      break
  }
}
