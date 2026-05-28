# SurakshaNet

**Safety Beyond Connectivity**

SurakshaNet is an AI-powered emergency safety website for live GPS tracking, Google Maps navigation, nearby safe-place detection, SOS sharing, disaster alerts, crowd reports, and AI-assisted evacuation guidance.

This update integrates Google Maps into the existing architecture while keeping SurakshaNet as a browser-based website.

## Architecture

```text
SurakshaNet
├── apps/web          Next.js website + React + Tailwind + Framer Motion + Google Maps JS API
├── apps/api          Node.js + Express emergency API gateway
├── services/ai       Python FastAPI AI microservice
├── packages/shared   Shared TypeScript emergency models
└── infra/db          PostgreSQL + PostGIS schema
```

## Google Maps Features

- Google Maps JavaScript API map rendering.
- Places API nearby safe-place detection.
- Directions API route display with traffic-aware alternatives.
- Distance Matrix API ETA and distance enrichment.
- Geocoding API address and reverse-geocode endpoint.
- Browser Geolocation API live GPS tracking.
- Accuracy radius visualization.
- Smooth live marker updates.
- Auto-center toggle.
- Battery-efficient GPS mode.
- Google Maps share links for SOS.
- Live traffic layer.
- Weather tile overlay.
- Disaster danger circles and emergency heat-style overlays.
- Marker clustering for safe places.
- Dark/light map themes.

## Nearby Safe Places

The backend ranks nearby:

- hospitals
- police stations
- fire stations
- shelters
- emergency camps
- safe public buildings
- restaurants
- pharmacies
- offices

Google Places is the primary source when `GOOGLE_MAPS_API_KEY` is configured. Existing PostGIS and OpenStreetMap/HOT sources remain as fallbacks, so current behavior is preserved.

## SOS Message

The SOS flow captures live and last-known location, stores an offline draft, and generates WhatsApp, SMS, and email links.

```text
🚨 EMERGENCY ALERT from SurakshaNet
I may need help.

Live Location:
https://maps.google.com/?q=<lat>,<lng>

Last Known Location:
https://maps.google.com/?q=<last_lat>,<last_lng>

Please contact me immediately.
```

## Environment

Copy the sample file:

```bash
cp .env.example .env
```

Important variables:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAP_ID=
NEXT_PUBLIC_ENABLE_GOOGLE_TRAFFIC=true
NEXT_PUBLIC_OPENWEATHER_API_KEY=

DATABASE_URL=postgres://surakshanet:surakshanet@localhost:5432/surakshanet
REDIS_URL=redis://localhost:6379
GOOGLE_MAPS_API_KEY=
GOOGLE_DISTANCE_MATRIX_KEY=
OPENWEATHER_API_KEY=
NASA_FIRMS_MAP_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
```

Use separate browser and server Google keys in production:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: restrict by HTTP referrer and allow Maps JavaScript API, Places API, Directions API, Geocoding API.
- `GOOGLE_MAPS_API_KEY` / `GOOGLE_DISTANCE_MATRIX_KEY`: restrict by server IP and allow Places API, Distance Matrix API, Geocoding API.
- Enable quota alerts and API usage monitoring in Google Cloud.

## Local Development

Start PostGIS and Redis:

```bash
docker compose up -d postgres redis
```

Install Node dependencies:

```bash
npm install
```

Install Python AI dependencies:

```bash
python3 -m venv services/ai/.venv
services/ai/.venv/bin/pip install -r services/ai/requirements.txt
```

Run the AI service:

```bash
services/ai/.venv/bin/uvicorn services.ai.app.main:app --reload --port 8000
```

Run the website and API services:

```bash
npm run dev
```

Open:

- Web: `http://localhost:3000`
- API health: `http://localhost:4000/health`
- AI health: `http://localhost:8000/health`

## API Examples

Nearby Google-backed safe places:

```bash
curl "http://localhost:4000/api/places?lat=13.0827&lng=80.2707&radiusMeters=8000"
```

Emergency alerts:

```bash
curl "http://localhost:4000/api/alerts?lat=13.0827&lng=80.2707"
```

Safe route with Distance Matrix ETA:

```bash
curl "http://localhost:4000/api/routes/safe?fromLat=13.0827&fromLng=80.2707&toLat=13.0674&toLng=80.2376"
```

Geocoding:

```bash
curl "http://localhost:4000/api/geocode?address=Chennai%20Central"
```

AI map assistant:

```bash
curl -X POST "http://localhost:4000/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Find nearest safe hospital","lat":13.0827,"lng":80.2707,"language":"en"}'
```

SOS:

```bash
curl -X POST "http://localhost:4000/api/sos" \
  -H "Content-Type: application/json" \
  -d '{"lat":13.0827,"lng":80.2707,"message":"Emergency SOS","contacts":[{"name":"Family","phone":"+910000000000"}]}'
```

## Files Updated

- `apps/web/lib/googleMaps.ts`: Google Maps loader, map options, share links, danger overlays.
- `apps/web/lib/useLocation.ts`: live GPS, accuracy, last-known location, battery mode.
- `apps/web/components/LiveMap.tsx`: Google Map, clustering, traffic, weather overlay, Directions API route drawing.
- `apps/web/components/SosButton.tsx`: SOS capture and WhatsApp/SMS/email sharing.
- `apps/web/components/AssistantPanel.tsx`: chatbot route/navigation integration.
- `apps/web/components/LiveSharePanel.tsx`: timed live-location sharing.
- `apps/api/src/services/places.ts`: expanded Google Places nearby search.
- `apps/api/src/routes/safeRoute.ts`: Distance Matrix ETA and route risk output.
- `apps/api/src/routes/geocode.ts`: Google Geocoding API adapter.
- `apps/api/src/routes/sos.ts`: Google Maps location links and share-link generation.
- `.env.example`: Google Maps and weather variables.

## Website Offline Data

SurakshaNet stores:

- last GPS coordinates
- offline SOS draft
- emergency contacts

Google Maps map tiles are still subject to Google’s online service behavior and terms. The website preserves emergency-critical data locally even when maps are temporarily unavailable.

## AI Prompt Template

```text
You are SurakshaNet AI, an emergency safety assistant.
Prioritize preservation of life, verified public alerts, nearby shelters/hospitals/police/fire stations, and clear steps.
Never claim certainty about a route unless official routing confirms it. Tell users to call local emergency services for immediate danger.
Return calm, concise instructions in the user's requested language.
```

## Production Notes

- Keep exact user location private by default.
- Store precise live location only during active SOS or explicit live sharing.
- Add Express rate limiting before public launch.
- Add Firebase Auth custom claims for admin pages.
- Add SMS/WhatsApp provider webhooks for real dispatch.
- Normalize flood, fire, riot, blocked-road, and disaster polygons into PostGIS and pass them to route-risk logic.
- Use Google Routes API, OSRM, or Valhalla with avoid polygons for advanced evacuation routing at national scale.
