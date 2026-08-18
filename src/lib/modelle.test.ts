import { describe, expect, it } from "vitest"
import { meshFuerSehenswuerdigkeit } from "./modelle"

describe("meshFuerSehenswuerdigkeit", () => {
  it("stands in a bear mesh at the Bärengraben", () => {
    const mesh = meshFuerSehenswuerdigkeit("baerengraben")
    expect(mesh?.src).toBe("/modelle/baer.dae")
    expect(mesh?.textur).toBe("/modelle/baer.png")
    expect(mesh?.credit).toMatch(/0 A\.D/)
  })

  it("stands in a basic civic building at the Bundeshaus", () => {
    const mesh = meshFuerSehenswuerdigkeit("bundeshaus")
    expect(mesh?.src).toBe("/modelle/bundeshaus.dae")
    expect(mesh?.textur).toBe("/modelle/bundeshaus.png")
    expect(mesh?.credit).toMatch(/0 A\.D/)
  })

  it("leaves sights without a mesh alone", () => {
    expect(meshFuerSehenswuerdigkeit("zytglogge")).toBeUndefined()
  })
})
