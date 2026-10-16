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

INSERT INTO vehicles (
  id, make, model, year, body_type, fuel_type, transmission, drivetrain,
  color, engine, horsepower, mpg, doors, seats, mileage, price, vin,
  location, condition, image_url, source
)
VALUES (
  'nissan-sentra-2025-demo', 'Nissan', 'Sentra', 2025, 'SUV', 'Gasolina',
  'Manual', '4WD', 'Rojo Rubí', '2.0L I4', 252, 24, 4, 5, 20482,
  17800, 'PENDIENTE-NISSAN-SENTRA-2025', 'Por confirmar', 'Excelente',
  'https://http2.mlstatic.com/D_Q_NP_2X_698992-MCO116099492444_092026-T.webp', 'database'
)
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;