-- Migration pour ajouter la géolocalisation aux clients et jobs
-- Exécutez ce script dans votre base de données Supabase

-- Ajouter les colonnes de géolocalisation à fc_clients
ALTER TABLE fc_clients
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Ajouter les colonnes de géolocalisation à fc_jobs
ALTER TABLE fc_jobs
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_status TEXT DEFAULT 'pending' CHECK (location_status IN ('pending', 'assigned', 'en_route', 'arrived', 'completed')),
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP WITH TIME ZONE;

-- Créer une table pour tracker la position en temps réel des employés
CREATE TABLE IF NOT EXISTS fc_employee_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  clerk_user_id TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2), -- Direction en degrés (0-360)
  speed DECIMAL(8, 2), -- Vitesse en km/h
  accuracy DECIMAL(8, 2), -- Précision en mètres
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(clerk_user_id)
);

-- Index pour les requêtes de géolocalisation
CREATE INDEX IF NOT EXISTS idx_fc_clients_location ON fc_clients(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_fc_jobs_location ON fc_jobs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_fc_jobs_location_status ON fc_jobs(location_status);
CREATE INDEX IF NOT EXISTS idx_fc_employee_locations_user ON fc_employee_locations(clerk_user_id);

-- RLS pour fc_employee_locations
ALTER TABLE fc_employee_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all employee locations"
  ON fc_employee_locations FOR SELECT
  USING (auth.jwt() ->> 'sub' IS NOT NULL);

CREATE POLICY "Users can update own location"
  ON fc_employee_locations FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own location_update"
  ON fc_employee_locations FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Fonction pour calculer la distance entre deux points (en mètres)
-- Utilise la formule de Haversine
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371000; -- Rayon de la Terre en mètres
  d_lat DECIMAL;
  d_lon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  d_lat := radians(lat2 - lat1);
  d_lon := radians(lon2 - lon1);

  a := sin(d_lat/2) * sin(d_lat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(d_lon/2) * sin(d_lon/2);

  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Commentaires pour documenter les nouvelles colonnes
COMMENT ON COLUMN fc_clients.latitude IS 'Latitude du client (format décimal)';
COMMENT ON COLUMN fc_clients.longitude IS 'Longitude du client (format décimal)';
COMMENT ON COLUMN fc_clients.formatted_address IS 'Adresse formatée par le service de géocodage';

COMMENT ON COLUMN fc_jobs.latitude IS 'Latitude du job (héritée du client ou personnalisée)';
COMMENT ON COLUMN fc_jobs.longitude IS 'Longitude du job (héritée du client ou personnalisée)';
COMMENT ON COLUMN fc_jobs.location_status IS 'Statut de localisation: pending (orange), assigned (orange), en_route (orange), arrived (vert), completed (vert)';
COMMENT ON COLUMN fc_jobs.is_urgent IS 'Job urgent (affiché en rouge sur la carte)';
COMMENT ON COLUMN fc_jobs.arrived_at IS 'Timestamp quand l''employé arrive à proximité du job';
COMMENT ON COLUMN fc_jobs.completed_at IS 'Timestamp quand le job est complété';

COMMENT ON TABLE fc_employee_locations IS 'Position en temps réel des employés pour le tracking GPS';
