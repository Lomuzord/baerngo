export const PICKEL_HALTBARKEIT = 32
export const TREFFER_HAND = 4
export const TREFFER_PICKEL = 1

export type AbbauStand = Record<string, number>

export function trefferProBlock(werkzeugId: string | null): number {
  return werkzeugId === "pickel" ? TREFFER_PICKEL : TREFFER_HAND
}

export function schlageBlock(
  stand: AbbauStand,
  blockId: string,
  werkzeugId: string | null,
): { stand: AbbauStand; zerstoert: boolean; treffer: number; braucht: number } {
  const braucht = trefferProBlock(werkzeugId)
  const treffer = (stand[blockId] ?? 0) + 1
  if (treffer >= braucht) {
    const danach = { ...stand }
    delete danach[blockId]
    return { stand: danach, zerstoert: true, treffer, braucht }
  }
  return {
    stand: { ...stand, [blockId]: treffer },
    zerstoert: false,
    treffer,
    braucht,
  }
}

export function nutzePickel(
  inventar: Record<string, number>,
  haltbarkeit: number,
): { inventar: Record<string, number>; haltbarkeit: number; zerbrochen: boolean } {
  if ((inventar.pickel ?? 0) < 1) {
    return { inventar, haltbarkeit, zerbrochen: false }
  }
  const rest = Math.max(0, haltbarkeit - 1)
  if (rest > 0) {
    return { inventar, haltbarkeit: rest, zerbrochen: false }
  }
  const danach = { ...inventar, pickel: inventar.pickel - 1 }
  if (danach.pickel <= 0) delete danach.pickel
  const noch = (danach.pickel ?? 0) > 0
  return {
    inventar: danach,
    haltbarkeit: noch ? PICKEL_HALTBARKEIT : 0,
    zerbrochen: true,
  }
}

export function haltbarkeitNachZugang(
  bisher: number,
  pickelVorher: number,
  pickelNachher: number,
): number {
  if (pickelNachher <= 0) return 0
  if (pickelVorher <= 0) return PICKEL_HALTBARKEIT
  return bisher > 0 ? bisher : PICKEL_HALTBARKEIT
}
