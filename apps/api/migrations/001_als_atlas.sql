CREATE TABLE IF NOT EXISTS patients (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  synthetic boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS observations (
  id text PRIMARY KEY,
  patient_id text NOT NULL REFERENCES patients(id),
  observed_at timestamptz NOT NULL,
  type text NOT NULL,
  value numeric,
  unit text,
  note text,
  source text NOT NULL,
  status text NOT NULL DEFAULT 'recorded',
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS checkins (
  id text PRIMARY KEY,
  patient_id text NOT NULL REFERENCES patients(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL,
  research_consent boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS research_consent (
  patient_id text PRIMARY KEY REFERENCES patients(id),
  enabled boolean NOT NULL DEFAULT false,
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS referral_reports (
  id text PRIMARY KEY,
  patient_id text NOT NULL REFERENCES patients(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft',
  payload jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS media_assets (
  id text PRIMARY KEY,
  patient_id text NOT NULL REFERENCES patients(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL,
  storage_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS observations_patient_time_idx ON observations(patient_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS checkins_patient_time_idx ON checkins(patient_id, created_at DESC);
