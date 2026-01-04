-- Create function to invalidate identity verification when avatar changes
CREATE OR REPLACE FUNCTION public.invalidate_identity_on_avatar_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when avatar_url actually changes (not null -> null or same value)
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND OLD.identity_verified = true THEN
    -- Reset identity verification status
    NEW.identity_verified = false;
    
    -- Delete any existing verification records so user can start fresh
    DELETE FROM identity_verifications WHERE profile_id = NEW.id;
    
    -- Create notification to inform the user
    INSERT INTO notifications (profile_id, type, title, description, link)
    VALUES (
      NEW.id,
      'identity_invalidated',
      '🔄 Verificación de identidad invalidada',
      'Tu foto de perfil ha cambiado. Por favor, vuelve a verificar tu identidad.',
      '/profile'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_avatar_change_invalidate_identity ON profiles;
CREATE TRIGGER on_avatar_change_invalidate_identity
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_identity_on_avatar_change();