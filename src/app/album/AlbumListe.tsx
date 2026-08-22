"use client"

import { useEffect, useState } from "react"
import { albumGegenstaende, parseAlbum } from "@/lib/album"

export function AlbumListe() {
  const [entdeckt, setEntdeckt] = useState<Set<string>>(new Set())

  useEffect(() => {
    const lies = () => {
      try {
        const roh = window.localStorage.getItem("baerngo-album")
        setEntdeckt(new Set(parseAlbum(roh ? JSON.parse(roh) : [])))
      } catch {
        setEntdeckt(new Set())
      }
    }
    lies()
    window.addEventListener("baerngo-album-neu", lies)
    return () => window.removeEventListener("baerngo-album-neu", lies)
  }, [])

  const alle = albumGegenstaende()

  return (
    <section className="mc-panel">
      <h1 className="mc-title">Sammelalbum</h1>
      <p className="mc-tagline">
        {entdeckt.size}/{alle.length} entdeckt
      </p>
      <ol className="mc-album" aria-label="Sammelalbum">
        {alle.map((gegenstand) => {
          const da = entdeckt.has(gegenstand.id)
          return (
            <li
              key={gegenstand.id}
              className={da ? "mc-album-karte" : "mc-album-karte mc-album-fehlt"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gegenstand.textur}
                alt={da ? gegenstand.name : "Unentdeckt"}
              />
              <span>{da ? gegenstand.name : "???"}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
