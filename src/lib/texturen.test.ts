import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { listGegenstaende } from "./gegenstaende"

describe("block textures", () => {
  it("ships a texture file for every item the game can grant or craft", () => {
    const root = join(process.cwd(), "public")
    for (const item of listGegenstaende()) {
      expect(existsSync(join(root, item.textur.replace(/^\//, "")))).toBe(true)
    }
    expect(existsSync(join(root, "manifest.webmanifest"))).toBe(true)
  })
})
