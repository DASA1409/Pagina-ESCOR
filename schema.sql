CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year > 1885),
  body_type TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  drivetrain TEXT NOT NULL,
  color TEXT NOT NULL,
  engine TEXT NOT NULL,
  horsepower INTEGER NOT NULL CHECK (horsepower >= 0),
  mpg NUMERIC,
  doors INTEGER NOT NULL CHECK (doors > 0),
  seats INTEGER NOT NULL CHECK (seats > 0),
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  vin TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  condition TEXT NOT NULL,
  image_url TEXT,
  source TEXT NOT NULL DEFAULT 'database',
  is_collector BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS usability_test_sessions (
  session_id UUID PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usability_test_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES usability_test_sessions(session_id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  event_type TEXT NOT NULL,
  elapsed_ms INTEGER NOT NULL CHECK (elapsed_ms >= 0),
  interval_ms INTEGER NOT NULL CHECK (interval_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, sequence_number)
);

ALTER TABLE usability_test_events
  DROP CONSTRAINT IF EXISTS usability_test_events_event_type_check;

ALTER TABLE usability_test_events
  ADD CONSTRAINT usability_test_events_event_type_check
  CHECK (event_type IN (
    'session_started',
    'catalog_search_submitted',
    'catalog_filter_changed',
    'chat_search_submitted',
    'compare_vehicle_toggled',
    'vehicle_selected',
    'usability_survey_opened',
    'usability_survey_closed',
    'usability_survey_submitted'
  ));

CREATE TABLE IF NOT EXISTS usability_test_surveys (
  session_id UUID PRIMARY KEY REFERENCES usability_test_sessions(session_id) ON DELETE CASCADE,
  age_group SMALLINT NOT NULL CONSTRAINT usability_test_surveys_adult_age_group_check CHECK (age_group BETWEEN 2 AND 4),
  consent_confirmed BOOLEAN NOT NULL CHECK (consent_confirmed),
  feedback_comment TEXT CONSTRAINT usability_test_surveys_feedback_comment_length_check
    CHECK (feedback_comment IS NULL OR char_length(feedback_comment) <= 2000),
  chatbot_discoverability SMALLINT NOT NULL CHECK (chatbot_discoverability BETWEEN 0 AND 5),
  chatbot_prompting_ease SMALLINT NOT NULL CHECK (chatbot_prompting_ease BETWEEN 0 AND 5),
  chatbot_result_relevance SMALLINT NOT NULL CHECK (chatbot_result_relevance BETWEEN 0 AND 5),
  catalog_navigation SMALLINT NOT NULL CHECK (catalog_navigation BETWEEN 0 AND 5),
  vehicle_details_clarity SMALLINT NOT NULL CHECK (vehicle_details_clarity BETWEEN 0 AND 5),
  comparison_discoverability SMALLINT NOT NULL CHECK (comparison_discoverability BETWEEN 0 AND 5),
  inventory_variety SMALLINT NOT NULL CHECK (inventory_variety BETWEEN 0 AND 5),
  task_completion SMALLINT NOT NULL CHECK (task_completion BETWEEN 0 AND 5),
  overall_satisfaction SMALLINT NOT NULL CHECK (overall_satisfaction BETWEEN 0 AND 5),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usability_test_surveys ADD COLUMN IF NOT EXISTS feedback_comment TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usability_test_surveys_adult_age_group_check'
      AND conrelid = 'usability_test_surveys'::regclass
  ) THEN
    ALTER TABLE usability_test_surveys
      ADD CONSTRAINT usability_test_surveys_adult_age_group_check
      CHECK (age_group BETWEEN 2 AND 4) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usability_test_surveys_feedback_comment_length_check'
      AND conrelid = 'usability_test_surveys'::regclass
  ) THEN
    ALTER TABLE usability_test_surveys
      ADD CONSTRAINT usability_test_surveys_feedback_comment_length_check
      CHECK (feedback_comment IS NULL OR char_length(feedback_comment) <= 2000) NOT VALID;
  END IF;
END $$;

INSERT INTO vehicles (
  id, make, model, year, body_type, fuel_type, transmission, drivetrain,
  color, engine, horsepower, mpg, doors, seats, mileage, price, vin,
  location, condition, image_url, source
)
VALUES (
  'nissan-sentra-2025-demo', 'Nissan', 'Sentra', 2025, 'SUV', 'Gasolina',
  'Manual', '4WD', 'Rojo Rubí', '2.0L I4', 252, 24, 4, 5, 20482,
  99990000 , 'PENDIENTE-NISSAN-SENTRA-2025', 'Por confirmar', 'Excelente',
  'https://http2.mlstatic.com/D_Q_NP_2X_698992-MCO116099492444_092026-T.webp', 'database'
)
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;