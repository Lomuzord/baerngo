import { tonAn } from "./klang"

// Generativer Soundtrack mit Pigstep-/Geometry-Dash-Energie, komplett
// über WebAudio synthetisiert: 112 BPM mit Swing, synkopiertes
// Sägezahn-Bass-Riff in A-Moll, Kick/Clap/Hats, plétzender Square-Lead
// aus der Moll-Pentatonik, Akkord-Stabs — dazwischen 4-Takt-Breakdowns
// mit Pad zum Luftholen. Keine Audiodateien, kein exakter Loop.

const BPM = 112
const SECHZEHNTEL = 60 / BPM / 4
// Swing: jede ungerade 16tel kommt etwas später — der Pigstep-Groove
const SWING = SECHZEHNTEL * 0.16

// Moll-Progression mit Zug: Am — Am — F — E (Halbtöne über C)
const PROGRESSION: readonly (readonly number[])[] = [
  [9, 12, 16], // Am
  [9, 12, 16], // Am
  [5, 9, 12], // F
  [4, 8, 11], // E
]
// A-Moll-Pentatonik relativ zum Grundton A
const PENTATONIK = [0, 3, 5, 7, 10]
// Bass-Riffs: 16 Schritte, Wert = Halbton über dem Akkordgrundton
const RIFFS: readonly (readonly (number | null)[])[] = [
  [0, null, 0, 12, null, null, 0, null, 0, null, 12, null, 0, 10, null, null],
  [0, null, null, 0, 12, null, 0, null, 0, null, 0, 10, null, 12, null, null],
  [0, null, 0, null, 12, null, 10, null, 0, null, 0, 12, null, null, 7, null],
]
// Lead-Phrasen (Positionen im 32er-Raster über 2 Takte)
const PHRASEN: readonly (readonly number[])[] = [
  [0, 3, 6, 8, 14, 16, 22, 24],
  [0, 4, 6, 12, 16, 20, 22, 28],
  [2, 6, 8, 11, 16, 19, 24, 27],
  [0, 8, 12, 14, 16, 24, 28, 30],
]

function frequenz(halbton: number, oktave = 0): number {
  return 261.63 * Math.pow(2, (halbton + oktave * 12) / 12)
}

function swingZeit(t: number, schritt16: number): number {
  return schritt16 % 2 === 1 ? t + SWING : t
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let hall: ConvolverNode | null = null
let hallWeg: GainNode | null = null
let echo: DelayNode | null = null
let echoWeg: GainNode | null = null

let laeuft = false
let planerTimer = 0
let naechsteZeit = 0
let schritt = 0 // 16tel-Zähler, endlos
let melodieTon = 7 // Startton (Quinte)
let phrase: readonly number[] = PHRASEN[0]!

function kontext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const AC =
    window.AudioContext ??
    (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  try {
    if (!ctx) {
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0.9
      master.connect(ctx.destination)

      // Synthetischer Hall: 2,2 s Rauschimpuls mit Exponentialabfall
      hall = ctx.createConvolver()
      const laenge = Math.floor(ctx.sampleRate * 2.2)
      const impuls = ctx.createBuffer(2, laenge, ctx.sampleRate)
      for (let kanal = 0; kanal < 2; kanal++) {
        const daten = impuls.getChannelData(kanal)
        for (let i = 0; i < laenge; i++) {
          daten[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / laenge, 2.4)
        }
      }
      hall.buffer = impuls
      hallWeg = ctx.createGain()
      hallWeg.gain.value = 0.4
      hallWeg.connect(hall)
      hall.connect(master)

      // Punktiertes Echo fürs Klavier
      echo = ctx.createDelay(2)
      echo.delayTime.value = SECHZEHNTEL * 3
      const rueck = ctx.createGain()
      rueck.gain.value = 0.3
      echo.connect(rueck)
      rueck.connect(echo)
      const echoMix = ctx.createGain()
      echoMix.gain.value = 0.22
      echo.connect(echoMix)
      echoMix.connect(master)
      echoWeg = ctx.createGain()
      echoWeg.gain.value = 1
      echoWeg.connect(echo)
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {})
    return ctx
  } catch {
    return null
  }
}

type StimmOptionen = {
  f: number
  t: number
  dauer: number
  gain: number
  typ?: OscillatorType
  anschlag?: number
  hallAnteil?: number
  echoAnteil?: number
  tiefpass?: number
}

function stimme(ac: AudioContext, o: StimmOptionen) {
  if (!master || !hallWeg || !echoWeg) return
  const start = o.t + (Math.random() - 0.5) * 0.012
  const osc = ac.createOscillator()
  osc.type = o.typ ?? "sine"
  osc.frequency.value = o.f
  const huell = ac.createGain()
  huell.gain.setValueAtTime(0.0001, start)
  huell.gain.exponentialRampToValueAtTime(o.gain, start + (o.anschlag ?? 0.02))
  huell.gain.exponentialRampToValueAtTime(0.0001, start + o.dauer)
  let ausgang: AudioNode = huell
  if (o.tiefpass) {
    const filter = ac.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = o.tiefpass
    huell.connect(filter)
    ausgang = filter
  }
  osc.connect(huell)
  ausgang.connect(master)
  if (o.hallAnteil) {
    const nass = ac.createGain()
    nass.gain.value = o.hallAnteil
    ausgang.connect(nass)
    nass.connect(hallWeg)
  }
  if (o.echoAnteil) {
    const nass = ac.createGain()
    nass.gain.value = o.echoAnteil
    ausgang.connect(nass)
    nass.connect(echoWeg)
  }
  osc.start(start)
  osc.stop(start + o.dauer + 0.1)
}

function klavier(ac: AudioContext, f: number, t: number, dauer: number, gain: number) {
  // Grundton + leicht verstimmte Zweitstimme + Oktavglanz
  stimme(ac, { f, t, dauer, gain, hallAnteil: 0.5, echoAnteil: 0.4 })
  stimme(ac, { f: f * 1.0035, t, dauer, gain: gain * 0.45, hallAnteil: 0.5 })
  stimme(ac, { f: f * 2, t, dauer: dauer * 0.7, gain: gain * 0.16, hallAnteil: 0.4 })
}

function schlagzeug(ac: AudioContext, art: "kick" | "hat" | "shaker", t: number, gain: number) {
  if (!master || !hall || !hallWeg) return
  if (art === "kick") {
    const osc = ac.createOscillator()
    const huell = ac.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(140, t)
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.09)
    huell.gain.setValueAtTime(gain, t)
    huell.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
    osc.connect(huell)
    huell.connect(master)
    osc.start(t)
    osc.stop(t + 0.2)
    return
  }
  const laenge = Math.floor(ac.sampleRate * 0.06)
  const puffer = ac.createBuffer(1, laenge, ac.sampleRate)
  const daten = puffer.getChannelData(0)
  for (let i = 0; i < laenge; i++) {
    daten[i] = (Math.random() * 2 - 1) * (1 - i / laenge)
  }
  const quelle = ac.createBufferSource()
  quelle.buffer = puffer
  const filter = ac.createBiquadFilter()
  filter.type = "highpass"
  filter.frequency.value = art === "hat" ? 6200 : 3400
  const huell = ac.createGain()
  huell.gain.setValueAtTime(gain, t)
  huell.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  quelle.connect(filter)
  filter.connect(huell)
  huell.connect(master)
  quelle.start(t)
}

function naechsterMelodieTonMoll(grundton: number): number {
  const kandidaten: number[] = []
  for (const oktave of [0, 12]) {
    for (const stufe of PENTATONIK) kandidaten.push(grundton + stufe + oktave)
  }
  const einzig = [...new Set(kandidaten)].sort((a, b) => a - b)
  const lage = einzig.findIndex((wert) => wert >= melodieTon)
  const sprung =
    Math.random() < 0.2
      ? Math.floor(Math.random() * 7) - 3
      : Math.random() < 0.5
        ? 1
        : -1
  const index = Math.min(einzig.length - 1, Math.max(0, lage + sprung))
  melodieTon = einzig[index]!
  return melodieTon
}

function planeSchritt(ac: AudioContext, roheZeit: number) {
  const imTakt = schritt % 16
  const takt = Math.floor(schritt / 16)
  const akkord = PROGRESSION[takt % PROGRESSION.length]!
  const grundton = akkord[0]!
  // 8 Takte Vollgas, dann 4 Takte Breakdown ohne Kick
  const abschnitt = takt % 12
  const breakdown = abschnitt >= 8
  const t = swingZeit(roheZeit, imTakt)

  // Pad nur im Breakdown — Luft holen
  if (breakdown && schritt % 16 === 0) {
    for (const stufe of akkord) {
      stimme(ac, {
        f: frequenz(stufe, -1),
        t,
        dauer: SECHZEHNTEL * 17,
        gain: 0.055,
        typ: "sawtooth",
        anschlag: SECHZEHNTEL * 4,
        tiefpass: 1100,
        hallAnteil: 0.6,
      })
    }
  }

  // Treibendes Bass-Riff (im Breakdown ruhiger: nur Grundton auf 1)
  const riff = RIFFS[takt % RIFFS.length]!
  const riffTon = breakdown ? (imTakt === 0 ? 0 : null) : riff[imTakt]!
  if (riffTon !== null && riffTon !== undefined) {
    stimme(ac, {
      f: frequenz(grundton + riffTon, -2),
      t,
      dauer: SECHZEHNTEL * 1.6,
      gain: 0.2,
      typ: "sawtooth",
      anschlag: 0.008,
      tiefpass: 700,
    })
    stimme(ac, {
      f: frequenz(grundton + riffTon, -3),
      t,
      dauer: SECHZEHNTEL * 1.6,
      gain: 0.12,
      typ: "triangle",
      anschlag: 0.008,
    })
  }

  // Schlagwerk: Kick synkopiert, Clap auf 2 und 4, Hats in 16teln
  if (!breakdown) {
    if (imTakt === 0 || imTakt === 6 || imTakt === 10) {
      schlagzeug(ac, "kick", t, 0.22)
    }
    if (imTakt === 4 || imTakt === 12) schlagzeug(ac, "shaker", t, 0.09)
    schlagzeug(ac, "hat", t, imTakt % 4 === 2 ? 0.055 : 0.024)
  } else if (imTakt % 4 === 0) {
    schlagzeug(ac, "hat", t, 0.03)
  }

  // Lead: plétzende Phrasen aus der A-Moll-Pentatonik
  const imPhrase = schritt % 32
  if (imPhrase === 0) {
    phrase = PHRASEN[Math.floor(Math.random() * PHRASEN.length)]!
    if (breakdown && Math.random() < 0.4) phrase = []
  }
  if (phrase.includes(imPhrase)) {
    const schwer = imPhrase % 8 === 0
    let ton: number
    if (schwer) {
      ton = akkord[Math.floor(Math.random() * akkord.length)]! % 12
      melodieTon = ton
    } else {
      ton = naechsterMelodieTonMoll(grundton)
    }
    const laenge = SECHZEHNTEL * (schwer ? 5 : 2.6)
    stimme(ac, {
      f: frequenz(ton, 1),
      t,
      dauer: laenge,
      gain: 0.14,
      typ: "square",
      anschlag: 0.006,
      tiefpass: 2600,
      hallAnteil: 0.3,
      echoAnteil: 0.35,
    })
    stimme(ac, {
      f: frequenz(ton, 0),
      t,
      dauer: laenge,
      gain: 0.05,
      typ: "triangle",
      anschlag: 0.006,
      hallAnteil: 0.3,
    })
  }

  // Kurzer Akkord-Stab auf der 1 jedes zweiten Takts (nur Vollgas)
  if (!breakdown && imTakt === 0 && takt % 2 === 1) {
    for (const stufe of akkord) {
      stimme(ac, {
        f: frequenz(stufe, 0),
        t,
        dauer: SECHZEHNTEL * 2.2,
        gain: 0.05,
        typ: "sawtooth",
        anschlag: 0.008,
        tiefpass: 1800,
        hallAnteil: 0.35,
      })
    }
  }
}

function planer() {
  if (!laeuft) return
  const ac = kontext()
  if (ac && tonAn() && !document.hidden) {
    if (naechsteZeit < ac.currentTime) naechsteZeit = ac.currentTime + 0.06
    while (naechsteZeit < ac.currentTime + 0.35) {
      planeSchritt(ac, naechsteZeit)
      naechsteZeit += SECHZEHNTEL
      schritt += 1
    }
  }
  planerTimer = window.setTimeout(planer, 110)
}

export function starteMusik() {
  if (laeuft || typeof window === "undefined" || !tonAn()) return
  if (!kontext()) return
  laeuft = true
  naechsteZeit = 0
  planer()
}

export function stoppeMusik() {
  laeuft = false
  window.clearTimeout(planerTimer)
}

export function musikLaeuft(): boolean {
  return laeuft
}
