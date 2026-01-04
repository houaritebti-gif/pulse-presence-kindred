-- Añadir campo de género y preferencias de género al perfil

-- Enum para géneros
CREATE TYPE public.gender_type AS ENUM (
  'woman',
  'man', 
  'non_binary',
  'trans_woman',
  'trans_man',
  'genderqueer',
  'genderfluid',
  'agender',
  'two_spirit',
  'other',
  'prefer_not_to_say'
);

-- Añadir columna de género al perfil
ALTER TABLE public.profiles 
ADD COLUMN gender gender_type DEFAULT NULL;

-- Crear tabla para preferencias de género (quién quiero conocer) - permite múltiples
CREATE TABLE public.profile_gender_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gender_preference gender_type NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(profile_id, gender_preference)
);

-- Habilitar RLS
ALTER TABLE public.profile_gender_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profile_gender_preferences
CREATE POLICY "Users can view preferences with legitimate interactions"
ON public.profile_gender_preferences
FOR SELECT
USING (public.can_view_profile(auth.uid(), profile_id));

CREATE POLICY "Users can manage their own preferences"
ON public.profile_gender_preferences
FOR ALL
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));