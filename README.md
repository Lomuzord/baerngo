# bärngo

**bärngo** (written **baerngo** where ä is a problem) is a school-project walk-to-play quiz for Sehenswürdigkeiten in Bern.

You go to a sight, answer the question there, and a correct answer grants a Minecraft resource for that place (Gold at the Zytglogge, a book at the GIBB, usw.).

The map is Mapbox GL JS: real Bern streets and 3D buildings, painted in a block palette, with Minecraft-styled cubes at each sight (Zytglogge, GIBB, usw.). Textures are original 16×16 pixel art. Phone layout uses a portrait web-app manifest and a bottom tab bar (Karte / Inventar / Werkbank). The Mapbox token stays in `.env.local`.

## Run

```bash
cp .env.example .env.local
# set MAPBOX_TOKEN
npm i
npm test
npm run dev
```

Open http://localhost:3000 on your phone. Allow location (and camera on **Bauen**). Walk to a sight, solve the quiz, then:

- **Werkbank:** drag blocks into the 3×3 grid (2 Gold → Goldblock, Honig+Buch → Honigbrot, Smaragd+Sandstein+Gold → Bernwappen)
- **Bauen:** pick a block and set it at your GPS; it also shows on the 3D map

## Design

- Catalog: which Sehenswürdigkeiten exist
- Scoring: is this answer correct
- Reach: is the player close enough
- Collect: which Minecraft resource a correct answer grants
- Map: how Bern is drawn (pixelated Mapbox image, token stays on the server)

The UI does not re-implement those rules.
