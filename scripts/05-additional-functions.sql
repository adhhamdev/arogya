-- Function to validate doctor availability before booking
CREATE OR REPLACE FUNCTION check_doctor_availability(
  doctor_id_param UUID,
  appointment_date_param DATE,
  appointment_time_param TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  day_of_week INTEGER;
  is_available BOOLEAN := FALSE;
BEGIN
  -- Get day of week
  day_of_week := EXTRACT(DOW FROM appointment_date_param);
  
  -- Check if doctor has availability for this day and time
  SELECT EXISTS(
    SELECT 1 FROM doctor_availability da
    WHERE da.doctor_id = doctor_id_param
      AND da.day_of_week = day_of_week
      AND da.is_available = true
      AND appointment_time_param >= da.start_time
      AND appointment_time_param < da.end_time
  ) INTO is_available;
  
  RETURN is_available;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get doctor statistics
CREATE OR REPLACE FUNCTION get_doctor_statistics(doctor_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_appointments', (
      SELECT COUNT(*)
      FROM appointments
      WHERE doctor_id = doctor_id_param
    ),
    'completed_appointments', (
      SELECT COUNT(*)
      FROM appointments
      WHERE doctor_id = doctor_id_param AND status = 'completed'
    ),
    'cancelled_appointments', (
      SELECT COUNT(*)
      FROM appointments
      WHERE doctor_id = doctor_id_param AND status = 'cancelled'
    ),
    'average_rating', (
      SELECT COALESCE(AVG(rating), 0)
      FROM appointments
      WHERE doctor_id = doctor_id_param AND rating IS NOT NULL
    ),
    'total_patients', (
      SELECT COUNT(DISTINCT patient_id)
      FROM appointments
      WHERE doctor_id = doctor_id_param
    ),
    'prescriptions_issued', (
      SELECT COUNT(*)
      FROM prescriptions
      WHERE doctor_id = doctor_id_param
    ),
    'this_month_appointments', (
      SELECT COUNT(*)
      FROM appointments
      WHERE doctor_id = doctor_id_param
        AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND appointment_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get patient statistics
CREATE OR REPLACE FUNCTION get_patient_statistics(patient_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_appointments', (
      SELECT COUNT(*)
      FROM appointments
      WHERE patient_id = patient_id_param
    ),
    'completed_appointments', (
      SELECT COUNT(*)
      FROM appointments
      WHERE patient_id = patient_id_param AND status = 'completed'
    ),
    'active_prescriptions', (
      SELECT COUNT(*)
      FROM prescriptions
      WHERE patient_id = patient_id_param AND status = 'active'
    ),
    'total_prescriptions', (
      SELECT COUNT(*)
      FROM prescriptions
      WHERE patient_id = patient_id_param
    ),
    'medical_records_count', (
      SELECT COUNT(*)
      FROM medical_records
      WHERE patient_id = patient_id_param
    ),
    'favorite_doctors', (
      SELECT json_agg(
        json_build_object(
          'doctor_id', d.id,
          'doctor_name', up.full_name,
          'specialty', s.name,
          'appointment_count', appointment_counts.count
        )
      )
      FROM (
        SELECT doctor_id, COUNT(*) as count
        FROM appointments
        WHERE patient_id = patient_id_param AND status = 'completed'
        GROUP BY doctor_id
        ORDER BY count DESC
        LIMIT 3
      ) appointment_counts
      JOIN doctors d ON appointment_counts.doctor_id = d.id
      JOIN user_profiles up ON d.id = up.id
      LEFT JOIN specialties s ON d.specialty_id = s.id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send appointment reminders (for future notification system)
CREATE OR REPLACE FUNCTION get_appointment_reminders(reminder_hours INTEGER DEFAULT 24)
RETURNS TABLE(
  appointment_id UUID,
  patient_id UUID,
  doctor_id UUID,
  patient_email TEXT,
  doctor_email TEXT,
  patient_name TEXT,
  doctor_name TEXT,
  appointment_date DATE,
  appointment_time TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as appointment_id,
    a.patient_id,
    a.doctor_id,
    p_profile.email as patient_email,
    d_profile.email as doctor_email,
    p_profile.full_name as patient_name,
    d_profile.full_name as doctor_name,
    a.appointment_date,
    a.appointment_time
  FROM appointments a
  JOIN user_profiles p_profile ON a.patient_id = p_profile.id
  JOIN user_profiles d_profile ON a.doctor_id = d_profile.id
  WHERE a.status = 'confirmed'
    AND a.appointment_date = CURRENT_DATE + INTERVAL '1 day' * (reminder_hours / 24)
    AND a.appointment_time BETWEEN 
      CURRENT_TIME - INTERVAL '1 hour' * (reminder_hours % 24)
      AND CURRENT_TIME + INTERVAL '1 hour' * (reminder_hours % 24);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular specialties
CREATE OR REPLACE FUNCTION get_popular_specialties(limit_param INTEGER DEFAULT 10)
RETURNS TABLE(
  specialty_id UUID,
  specialty_name TEXT,
  doctor_count BIGINT,
  appointment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as specialty_id,
    s.name as specialty_name,
    COUNT(DISTINCT d.id) as doctor_count,
    COUNT(a.id) as appointment_count
  FROM specialties s
  LEFT JOIN doctors d ON s.id = d.specialty_id AND d.is_verified = true
  LEFT JOIN appointments a ON d.id = a.doctor_id
  GROUP BY s.id, s.name
  ORDER BY appointment_count DESC, doctor_count DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update prescription status
CREATE OR REPLACE FUNCTION update_prescription_status(
  prescription_id_param UUID,
  new_status TEXT,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  prescription_record RECORD;
BEGIN
  -- Get prescription details
  SELECT * INTO prescription_record
  FROM prescriptions
  WHERE id = prescription_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prescription not found';
  END IF;
  
  -- Check if user has permission (doctor who created it or patient who owns it)
  IF prescription_record.doctor_id != user_id_param AND 
     prescription_record.patient_id != user_id_param THEN
    RAISE EXCEPTION 'You do not have permission to update this prescription';
  END IF;
  
  -- Validate status
  IF new_status NOT IN ('active', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid prescription status';
  END IF;
  
  -- Update prescription
  UPDATE prescriptions
  SET status = new_status::prescription_status
  WHERE id = prescription_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get doctor's schedule for a specific date range
CREATE OR REPLACE FUNCTION get_doctor_schedule(
  doctor_id_param UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  appointment_date DATE,
  appointment_time TIME,
  patient_name TEXT,
  patient_phone TEXT,
  reason TEXT,
  status TEXT,
  appointment_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.appointment_date,
    a.appointment_time,
    up.full_name as patient_name,
    up.phone as patient_phone,
    a.reason,
    a.status::TEXT,
    a.id as appointment_id
  FROM appointments a
  JOIN user_profiles up ON a.patient_id = up.id
  WHERE a.doctor_id = doctor_id_param
    AND a.appointment_date BETWEEN start_date AND end_date
    AND a.status IN ('pending', 'confirmed')
  ORDER BY a.appointment_date, a.appointment_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk update doctor availability
CREATE OR REPLACE FUNCTION update_doctor_availability(
  doctor_id_param UUID,
  availability_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  day_data JSONB;
BEGIN
  -- Delete existing availability
  DELETE FROM doctor_availability WHERE doctor_id = doctor_id_param;
  
  -- Insert new availability
  FOR day_data IN SELECT * FROM jsonb_array_elements(availability_data)
  LOOP
    INSERT INTO doctor_availability (
      doctor_id,
      day_of_week,
      start_time,
      end_time,
      is_available
    ) VALUES (
      doctor_id_param,
      (day_data->>'day_of_week')::INTEGER,
      (day_data->>'start_time')::TIME,
      (day_data->>'end_time')::TIME,
      COALESCE((day_data->>'is_available')::BOOLEAN, true)
    );
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for additional functions
GRANT EXECUTE ON FUNCTION check_doctor_availability(UUID, DATE, TIME) TO authenticated;
GRANT EXECUTE ON FUNCTION get_doctor_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_patient_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_appointment_reminders(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_specialties(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_prescription_status(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_doctor_schedule(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION update_doctor_availability(UUID, JSONB) TO authenticated;
