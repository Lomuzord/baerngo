# bärngo

**bärngo** (written **baerngo** where ä is a problem) is a school-project walk-to-play quiz for Sehenswürdigkeiten in Bern.

You go to a sight, answer the question there, and only a correct answer counts. Minecraft resources are not in this MVP.

The map is Mapbox. The token lives in `.env.local` and is never committed.

## Run

```bash
cp .env.example .env.local
# set MAPBOX_TOKEN
npm i
npm test
npm run dev
```

Open http://localhost:3000. Allow location. Walk to the Zytglogge (Zytglogä), the Münster, the Bärengraben, or the Bundeshaus — the quiz unlocks within about 80 metres.

## Design

- Catalog: which Sehenswürdigkeiten exist
- Scoring: is this answer correct
- Reach: is the player close enough
- Map: how Bern is drawn (Mapbox static image, token stays on the server)

The UI does not re-implement those rules.
