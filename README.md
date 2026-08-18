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

Open http://localhost:3000. Allow location. Walk to the Zytglogge (Zytglogä), the Münster, the Bärengraben, the Bundeshaus, or the GIBB — the quiz unlocks within about 80 metres.

## Design

- Catalog: which Sehenswürdigkeiten exist
- Scoring: is this answer correct
- Reach: is the player close enough
- Collect: which Minecraft resource a correct answer grants
- Map: how Bern is drawn (pixelated Mapbox image, token stays on the server)

The UI does not re-implement those rules.
