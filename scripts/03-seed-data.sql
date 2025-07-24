-- Insert specialties
INSERT INTO specialties (name, description) VALUES
  ('General Medicine', 'Primary healthcare and general medical conditions'),
  ('Cardiology', 'Heart and cardiovascular system disorders'),
  ('Dermatology', 'Skin, hair, and nail conditions'),
  ('Pediatrics', 'Medical care for infants, children, and adolescents'),
  ('Orthopedics', 'Musculoskeletal system disorders'),
  ('Gynecology', 'Women''s reproductive health'),
  ('Psychiatry', 'Mental health and behavioral disorders'),
  ('Ophthalmology', 'Eye and vision care'),
  ('ENT', 'Ear, nose, and throat conditions'),
  ('Neurology', 'Nervous system disorders');

-- Create functions for triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
