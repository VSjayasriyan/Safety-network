CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE,
  name TEXT,
  email TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  notify_on_sos BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS safe_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  open_now BOOLEAN,
  capacity_score NUMERIC DEFAULT 0.7,
  accessibility_score NUMERIC DEFAULT 0.7,
  geom GEOGRAPHY(POINT, 4326) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safe_places_geom ON safe_places USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_safe_places_type ON safe_places(type);

CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  certainty TEXT DEFAULT 'unknown',
  area TEXT,
  geom GEOGRAPHY(GEOMETRY, 4326),
  radius_km NUMERIC,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  url TEXT,
  instructions TEXT[],
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_geom ON emergency_alerts USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_type ON emergency_alerts(type);

CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity INTEGER CHECK (severity BETWEEN 1 AND 5),
  geom GEOGRAPHY(POINT, 4326) NOT NULL,
  media_urls TEXT[],
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incident_reports_geom ON incident_reports USING GIST (geom);

CREATE TABLE IF NOT EXISTS sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  geom GEOGRAPHY(POINT, 4326) NOT NULL,
  status TEXT DEFAULT 'active',
  message TEXT,
  shared_with JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
