import { describe, expect, it } from "vitest"
import { neuerBlock } from "./bauen"

describe("neuerBlock", () => {
  it("records a placed block at the given Bern coordinates", () => {
    const block = neuerBlock("goldblock", 46.94798, 7.44743)
    expect(block.gegenstandId).toBe("goldblock")
    expect(block.lat).toBe(46.94798)
    expect(block.lng).toBe(7.44743)
    expect(block.id).toContain("goldblock")
  })
})
