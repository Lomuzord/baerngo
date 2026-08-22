import { describe, expect, it } from "vitest"
import { albumGegenstaende, merkeEntdeckt, parseAlbum } from "./album"

describe("album", () => {
  it("excludes never-collectable blocks", () => {
    const ids = albumGegenstaende().map((g) => g.id)
    expect(ids).not.toContain("wasser")
    expect(ids).not.toContain("ackerboden")
    expect(ids).toContain("stein")
    expect(ids).toContain("brot")
  })

  it("parses storage defensively", () => {
    expect(parseAlbum(["stein", "stein", "quatsch", 5])).toEqual(["stein"])
    expect(parseAlbum("kaputt")).toEqual([])
  })

  it("records new discoveries once and keeps the reference otherwise", () => {
    const eins = merkeEntdeckt([], ["stein", "gras"])
    expect(eins.neu).toEqual(["stein", "gras"])
    const zwei = merkeEntdeckt(eins.album, ["stein"])
    expect(zwei.neu).toEqual([])
    expect(zwei.album).toBe(eins.album)
    expect(merkeEntdeckt([], ["wasser"]).neu).toEqual([])
  })
})
