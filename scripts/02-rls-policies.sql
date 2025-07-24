-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Doctors policies
CREATE POLICY "Anyone can view verified doctors" ON doctors
  FOR SELECT USING (is_verified = true);

CREATE POLICY "Doctors can update their own profile" ON doctors
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Doctors can insert their own profile" ON doctors
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Patients policies
CREATE POLICY "Patients can view their own profile" ON patients
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Doctors can view their patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.patient_id = patients.id 
      AND appointments.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Patients can update their own profile" ON patients
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Patients can insert their own profile" ON patients
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Appointments policies
CREATE POLICY "Patients can view their own appointments" ON appointments
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view their own appointments" ON appointments
  FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Patients can create appointments" ON appointments
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors can update their appointments" ON appointments
  FOR UPDATE USING (doctor_id = auth.uid());

CREATE POLICY "Patients can update their appointments" ON appointments
  FOR UPDATE USING (patient_id = auth.uid());

-- Prescriptions policies
CREATE POLICY "Patients can view their own prescriptions" ON prescriptions
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view prescriptions they created" ON prescriptions
  FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can create prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their prescriptions" ON prescriptions
  FOR UPDATE USING (doctor_id = auth.uid());

-- Medical records policies
CREATE POLICY "Patients can view their own records" ON medical_records
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view their patients' records" ON medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.patient_id = medical_records.patient_id 
      AND appointments.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Patients can create their own records" ON medical_records
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update their own records" ON medical_records
  FOR UPDATE USING (patient_id = auth.uid());

-- Doctor availability policies
CREATE POLICY "Anyone can view doctor availability" ON doctor_availability
  FOR SELECT USING (true);

CREATE POLICY "Doctors can manage their availability" ON doctor_availability
  FOR ALL USING (doctor_id = auth.uid());

-- Specialties policies (public read)
CREATE POLICY "Anyone can view specialties" ON specialties
  FOR SELECT USING (true);
