-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  
  -- If user is registering as a patient, create patient record
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'patient' THEN
    INSERT INTO patients (id) VALUES (NEW.id);
  END IF;
  
  -- If user is registering as a doctor, create doctor record
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'doctor' THEN
    INSERT INTO doctors (id, medical_license, is_verified)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'medical_license', 'PENDING'),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update doctor rating after appointment completion
CREATE OR REPLACE FUNCTION update_doctor_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Only update rating when appointment is marked as completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Calculate average rating for the doctor
    SELECT 
      COALESCE(AVG(rating), 0.0),
      COUNT(*)
    INTO avg_rating, review_count
    FROM appointments 
    WHERE doctor_id = NEW.doctor_id 
      AND status = 'completed' 
      AND rating IS NOT NULL;
    
    -- Update doctor's rating and review count
    UPDATE doctors 
    SET 
      rating = avg_rating,
      total_reviews = review_count
    WHERE id = NEW.doctor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating doctor rating
DROP TRIGGER IF EXISTS on_appointment_completed ON appointments;
CREATE TRIGGER on_appointment_completed
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_doctor_rating();

-- Function to prevent double booking
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if doctor already has an appointment at this time
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE doctor_id = NEW.doctor_id 
      AND appointment_date = NEW.appointment_date 
      AND appointment_time = NEW.appointment_time
      AND status IN ('pending', 'confirmed')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Doctor already has an appointment at this time';
  END IF;
  
  -- Check if patient already has an appointment at this time
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE patient_id = NEW.patient_id 
      AND appointment_date = NEW.appointment_date 
      AND appointment_time = NEW.appointment_time
      AND status IN ('pending', 'confirmed')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Patient already has an appointment at this time';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent double booking
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON appointments;
CREATE TRIGGER prevent_double_booking_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION prevent_double_booking();

-- Function to auto-expire prescriptions
CREATE OR REPLACE FUNCTION auto_expire_prescriptions()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-expire prescriptions that have passed their valid_until date
  UPDATE prescriptions 
  SET status = 'completed'
  WHERE valid_until < CURRENT_DATE 
    AND status = 'active';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate appointment time slots
CREATE OR REPLACE FUNCTION validate_appointment_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if appointment is in the past
  IF NEW.appointment_date < CURRENT_DATE OR 
     (NEW.appointment_date = CURRENT_DATE AND NEW.appointment_time < CURRENT_TIME) THEN
    RAISE EXCEPTION 'Cannot book appointments in the past';
  END IF;
  
  -- Check if appointment is too far in the future (6 months)
  IF NEW.appointment_date > CURRENT_DATE + INTERVAL '6 months' THEN
    RAISE EXCEPTION 'Cannot book appointments more than 6 months in advance';
  END IF;
  
  -- Validate appointment time is within working hours (9 AM to 6 PM)
  IF NEW.appointment_time < '09:00:00' OR NEW.appointment_time > '18:00:00' THEN
    RAISE EXCEPTION 'Appointments can only be booked between 9 AM and 6 PM';
  END IF;
  
  -- Check if it's a weekend (Saturday = 6, Sunday = 0)
  IF EXTRACT(DOW FROM NEW.appointment_date) IN (0, 6) THEN
    RAISE EXCEPTION 'Appointments cannot be booked on weekends';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for appointment time validation
DROP TRIGGER IF EXISTS validate_appointment_time_trigger ON appointments;
CREATE TRIGGER validate_appointment_time_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION validate_appointment_time();

-- Function to create prescription from appointment
CREATE OR REPLACE FUNCTION create_prescription_from_appointment(
  appointment_id_param UUID,
  medications_param JSONB,
  instructions_param TEXT DEFAULT NULL,
  valid_days INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  prescription_id UUID;
  appointment_record RECORD;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM appointments
  WHERE id = appointment_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  
  -- Check if appointment is completed
  IF appointment_record.status != 'completed' THEN
    RAISE EXCEPTION 'Can only create prescriptions for completed appointments';
  END IF;
  
  -- Create prescription
  INSERT INTO prescriptions (
    appointment_id,
    doctor_id,
    patient_id,
    medications,
    instructions,
    valid_until
  ) VALUES (
    appointment_id_param,
    appointment_record.doctor_id,
    appointment_record.patient_id,
    medications_param,
    instructions_param,
    CURRENT_DATE + INTERVAL '1 day' * valid_days
  ) RETURNING id INTO prescription_id;
  
  RETURN prescription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available time slots for a doctor
CREATE OR REPLACE FUNCTION get_available_slots(
  doctor_id_param UUID,
  date_param DATE
)
RETURNS TABLE(time_slot TIME) AS $$
DECLARE
  day_of_week INTEGER;
  availability_record RECORD;
  slot_time TIME;
BEGIN
  -- Get day of week (0 = Sunday, 1 = Monday, etc.)
  day_of_week := EXTRACT(DOW FROM date_param);
  
  -- Check if doctor has availability for this day
  SELECT * INTO availability_record
  FROM doctor_availability
  WHERE doctor_id = doctor_id_param
    AND day_of_week = EXTRACT(DOW FROM date_param)
    AND is_available = true;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Generate 30-minute slots between start and end time
  slot_time := availability_record.start_time;
  
  WHILE slot_time < availability_record.end_time LOOP
    -- Check if slot is not already booked
    IF NOT EXISTS (
      SELECT 1 FROM appointments
      WHERE doctor_id = doctor_id_param
        AND appointment_date = date_param
        AND appointment_time = slot_time
        AND status IN ('pending', 'confirmed')
    ) THEN
      time_slot := slot_time;
      RETURN NEXT;
    END IF;
    
    slot_time := slot_time + INTERVAL '30 minutes';
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search doctors
CREATE OR REPLACE FUNCTION search_doctors(
  search_term TEXT DEFAULT NULL,
  specialty_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 20,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  specialty_name TEXT,
  years_experience INTEGER,
  consultation_fee DECIMAL(10,2),
  rating DECIMAL(3,2),
  total_reviews INTEGER,
  bio TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    up.full_name,
    s.name as specialty_name,
    d.years_experience,
    d.consultation_fee,
    d.rating,
    d.total_reviews,
    d.bio,
    up.avatar_url
  FROM doctors d
  JOIN user_profiles up ON d.id = up.id
  LEFT JOIN specialties s ON d.specialty_id = s.id
  WHERE d.is_verified = true
    AND d.is_available = true
    AND (search_term IS NULL OR 
         up.full_name ILIKE '%' || search_term || '%' OR
         s.name ILIKE '%' || search_term || '%' OR
         d.bio ILIKE '%' || search_term || '%')
    AND (specialty_id_param IS NULL OR d.specialty_id = specialty_id_param)
  ORDER BY d.rating DESC, d.total_reviews DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get patient dashboard data
CREATE OR REPLACE FUNCTION get_patient_dashboard(patient_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'upcoming_appointments', (
      SELECT json_agg(
        json_build_object(
          'id', a.id,
          'appointment_date', a.appointment_date,
          'appointment_time', a.appointment_time,
          'doctor_name', up.full_name,
          'specialty', s.name,
          'status', a.status
        )
      )
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN user_profiles up ON d.id = up.id
      LEFT JOIN specialties s ON d.specialty_id = s.id
      WHERE a.patient_id = patient_id_param
        AND a.appointment_date >= CURRENT_DATE
        AND a.status IN ('pending', 'confirmed')
      ORDER BY a.appointment_date, a.appointment_time
      LIMIT 5
    ),
    'recent_prescriptions', (
      SELECT json_agg(
        json_build_object(
          'id', p.id,
          'created_at', p.created_at,
          'doctor_name', up.full_name,
          'medications_count', json_array_length(p.medications),
          'status', p.status
        )
      )
      FROM prescriptions p
      JOIN doctors d ON p.doctor_id = d.id
      JOIN user_profiles up ON d.id = up.id
      WHERE p.patient_id = patient_id_param
        AND p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT 3
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get doctor dashboard data
CREATE OR REPLACE FUNCTION get_doctor_dashboard(doctor_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'upcoming_appointments', (
      SELECT json_agg(
        json_build_object(
          'id', a.id,
          'appointment_date', a.appointment_date,
          'appointment_time', a.appointment_time,
          'patient_name', up.full_name,
          'reason', a.reason,
          'status', a.status
        )
      )
      FROM appointments a
      JOIN patients pt ON a.patient_id = pt.id
      JOIN user_profiles up ON pt.id = up.id
      WHERE a.doctor_id = doctor_id_param
        AND a.appointment_date >= CURRENT_DATE
        AND a.status IN ('pending', 'confirmed')
      ORDER BY a.appointment_date, a.appointment_time
      LIMIT 5
    ),
    'today_appointments', (
      SELECT COUNT(*)
      FROM appointments
      WHERE doctor_id = doctor_id_param
        AND appointment_date = CURRENT_DATE
        AND status IN ('pending', 'confirmed')
    ),
    'total_patients', (
      SELECT COUNT(DISTINCT patient_id)
      FROM appointments
      WHERE doctor_id = doctor_id_param
        AND status = 'completed'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel appointment
CREATE OR REPLACE FUNCTION cancel_appointment(
  appointment_id_param UUID,
  user_id_param UUID,
  cancellation_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM appointments
  WHERE id = appointment_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  
  -- Check if user has permission to cancel
  IF appointment_record.patient_id != user_id_param AND 
     appointment_record.doctor_id != user_id_param THEN
    RAISE EXCEPTION 'You do not have permission to cancel this appointment';
  END IF;
  
  -- Check if appointment can be cancelled (not in the past or already completed)
  IF appointment_record.status = 'completed' THEN
    RAISE EXCEPTION 'Cannot cancel completed appointments';
  END IF;
  
  IF appointment_record.status = 'cancelled' THEN
    RAISE EXCEPTION 'Appointment is already cancelled';
  END IF;
  
  -- Update appointment status
  UPDATE appointments
  SET 
    status = 'cancelled',
    notes = COALESCE(notes || E'\n', '') || 'Cancelled: ' || COALESCE(cancellation_reason, 'No reason provided'),
    updated_at = NOW()
  WHERE id = appointment_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to confirm appointment (for doctors)
CREATE OR REPLACE FUNCTION confirm_appointment(
  appointment_id_param UUID,
  doctor_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM appointments
  WHERE id = appointment_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  
  -- Check if doctor has permission
  IF appointment_record.doctor_id != doctor_id_param THEN
    RAISE EXCEPTION 'You do not have permission to confirm this appointment';
  END IF;
  
  -- Check if appointment is in pending status
  IF appointment_record.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending appointments can be confirmed';
  END IF;
  
  -- Update appointment status
  UPDATE appointments
  SET 
    status = 'confirmed',
    updated_at = NOW()
  WHERE id = appointment_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete appointment and add notes
CREATE OR REPLACE FUNCTION complete_appointment(
  appointment_id_param UUID,
  doctor_id_param UUID,
  consultation_notes TEXT DEFAULT NULL,
  patient_rating INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM appointments
  WHERE id = appointment_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  
  -- Check if doctor has permission
  IF appointment_record.doctor_id != doctor_id_param THEN
    RAISE EXCEPTION 'You do not have permission to complete this appointment';
  END IF;
  
  -- Check if appointment is confirmed
  IF appointment_record.status != 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed appointments can be completed';
  END IF;
  
  -- Validate rating if provided
  IF patient_rating IS NOT NULL AND (patient_rating < 1 OR patient_rating > 5) THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  
  -- Update appointment status
  UPDATE appointments
  SET 
    status = 'completed',
    notes = COALESCE(consultation_notes, ''),
    rating = patient_rating,
    updated_at = NOW()
  WHERE id = appointment_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get appointment history for a patient
CREATE OR REPLACE FUNCTION get_patient_appointment_history(
  patient_id_param UUID,
  limit_param INTEGER DEFAULT 10,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  appointment_date DATE,
  appointment_time TIME,
  doctor_name TEXT,
  specialty_name TEXT,
  reason TEXT,
  status TEXT,
  notes TEXT,
  consultation_fee DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    up.full_name as doctor_name,
    s.name as specialty_name,
    a.reason,
    a.status::TEXT,
    a.notes,
    a.consultation_fee,
    a.created_at
  FROM appointments a
  JOIN doctors d ON a.doctor_id = d.id
  JOIN user_profiles up ON d.id = up.id
  LEFT JOIN specialties s ON d.specialty_id = s.id
  WHERE a.patient_id = patient_id_param
  ORDER BY a.appointment_date DESC, a.appointment_time DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance on functions
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_valid_until ON prescriptions(valid_until);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available, is_verified);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION update_doctor_rating() TO authenticated;
GRANT EXECUTE ON FUNCTION prevent_double_booking() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_expire_prescriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_appointment_time() TO authenticated;
GRANT EXECUTE ON FUNCTION create_prescription_from_appointment(UUID, JSONB, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION search_doctors(TEXT, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_patient_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_doctor_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_appointment(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_appointment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_appointment(UUID, UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_patient_appointment_history(UUID, INTEGER, INTEGER) TO authenticated;
