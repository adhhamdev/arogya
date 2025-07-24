-- Function to create notification system (for future implementation)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notification policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param UUID,
  title_param TEXT,
  message_param TEXT,
  type_param TEXT DEFAULT 'info',
  data_param JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (user_id_param, title_param, message_param, type_param, data_param)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send appointment confirmation notification
CREATE OR REPLACE FUNCTION notify_appointment_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  patient_name TEXT;
  doctor_name TEXT;
BEGIN
  -- Only send notification when status changes to confirmed
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Get patient and doctor names
    SELECT up.full_name INTO patient_name
    FROM user_profiles up
    WHERE up.id = NEW.patient_id;
    
    SELECT up.full_name INTO doctor_name
    FROM user_profiles up
    WHERE up.id = NEW.doctor_id;
    
    -- Notify patient
    PERFORM create_notification(
      NEW.patient_id,
      'Appointment Confirmed',
      'Your appointment with Dr. ' || doctor_name || ' has been confirmed for ' || 
      NEW.appointment_date || ' at ' || NEW.appointment_time,
      'success',
      json_build_object('appointment_id', NEW.id, 'type', 'appointment_confirmed')
    );
    
    -- Notify doctor
    PERFORM create_notification(
      NEW.doctor_id,
      'New Appointment Confirmed',
      'Appointment with ' || patient_name || ' confirmed for ' || 
      NEW.appointment_date || ' at ' || NEW.appointment_time,
      'info',
      json_build_object('appointment_id', NEW.id, 'type', 'appointment_confirmed')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for appointment confirmation notifications
DROP TRIGGER IF EXISTS notify_appointment_confirmed_trigger ON appointments;
CREATE TRIGGER notify_appointment_confirmed_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION notify_appointment_confirmed();

-- Function to send appointment cancellation notification
CREATE OR REPLACE FUNCTION notify_appointment_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  patient_name TEXT;
  doctor_name TEXT;
  cancelled_by TEXT;
BEGIN
  -- Only send notification when status changes to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Get patient and doctor names
    SELECT up.full_name INTO patient_name
    FROM user_profiles up
    WHERE up.id = NEW.patient_id;
    
    SELECT up.full_name INTO doctor_name
    FROM user_profiles up
    WHERE up.id = NEW.doctor_id;
    
    -- Determine who cancelled (this would need to be tracked in the application)
    cancelled_by := 'System';
    
    -- Notify patient
    PERFORM create_notification(
      NEW.patient_id,
      'Appointment Cancelled',
      'Your appointment with Dr. ' || doctor_name || ' scheduled for ' || 
      NEW.appointment_date || ' at ' || NEW.appointment_time || ' has been cancelled.',
      'warning',
      json_build_object('appointment_id', NEW.id, 'type', 'appointment_cancelled')
    );
    
    -- Notify doctor
    PERFORM create_notification(
      NEW.doctor_id,
      'Appointment Cancelled',
      'Appointment with ' || patient_name || ' scheduled for ' || 
      NEW.appointment_date || ' at ' || NEW.appointment_time || ' has been cancelled.',
      'warning',
      json_build_object('appointment_id', NEW.id, 'type', 'appointment_cancelled')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for appointment cancellation notifications
DROP TRIGGER IF EXISTS notify_appointment_cancelled_trigger ON appointments;
CREATE TRIGGER notify_appointment_cancelled_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION notify_appointment_cancelled();

-- Function to send new prescription notification
CREATE OR REPLACE FUNCTION notify_new_prescription()
RETURNS TRIGGER AS $$
DECLARE
  doctor_name TEXT;
  medication_count INTEGER;
BEGIN
  -- Get doctor name
  SELECT up.full_name INTO doctor_name
  FROM user_profiles up
  WHERE up.id = NEW.doctor_id;
  
  -- Get medication count
  medication_count := json_array_length(NEW.medications);
  
  -- Notify patient
  PERFORM create_notification(
    NEW.patient_id,
    'New Prescription Available',
    'Dr. ' || doctor_name || ' has issued a new prescription with ' || 
    medication_count || ' medication(s). Please review your prescriptions.',
    'success',
    json_build_object('prescription_id', NEW.id, 'type', 'new_prescription')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new prescription notifications
DROP TRIGGER IF EXISTS notify_new_prescription_trigger ON prescriptions;
CREATE TRIGGER notify_new_prescription_trigger
  AFTER INSERT ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION notify_new_prescription();

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 20,
  offset_param INTEGER DEFAULT 0,
  unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  is_read BOOLEAN,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.is_read,
    n.data,
    n.created_at
  FROM notifications n
  WHERE n.user_id = user_id_param
    AND (NOT unread_only OR n.is_read = FALSE)
  ORDER BY n.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  notification_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE id = notification_id_param AND user_id = user_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE user_id = user_id_param AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM notifications
  WHERE user_id = user_id_param AND is_read = FALSE;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for notification functions
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(UUID, INTEGER, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
