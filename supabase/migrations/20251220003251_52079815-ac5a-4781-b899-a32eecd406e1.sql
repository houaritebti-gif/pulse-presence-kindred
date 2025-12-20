-- Crear tabla de perfiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  vibe TEXT,
  city TEXT DEFAULT 'Madrid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Crear tabla de tribus (muchas por perfil)
CREATE TABLE public.profile_tribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tribe TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de presencia (quién está "presente" ahora)
CREATE TABLE public.presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_present BOOLEAN DEFAULT false,
  last_pulse TIMESTAMP WITH TIME ZONE DEFAULT now(),
  visible_to_others BOOLEAN DEFAULT true,
  UNIQUE(profile_id)
);

-- Crear tabla de chispas (interés mutuo)
CREATE TABLE public.sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(from_profile_id, to_profile_id)
);

-- Crear tabla de mensajes fantasma
CREATE TABLE public.ghost_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(from_profile_id, to_profile_id)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghost_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Perfiles - todos pueden ver perfiles públicos, solo el dueño edita
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS: Tribus - visible para auth, solo dueño edita
CREATE POLICY "Tribes viewable by authenticated"
ON public.profile_tribes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own tribes"
ON public.profile_tribes FOR ALL
TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS: Presencia - visible si visible_to_others, solo dueño edita
CREATE POLICY "Presence viewable if visible"
ON public.presence FOR SELECT
TO authenticated
USING (visible_to_others = true OR profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own presence"
ON public.presence FOR ALL
TO authenticated
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS: Chispas - solo el emisor puede ver/crear sus chispas
CREATE POLICY "Users can see their own sparks"
ON public.sparks FOR SELECT
TO authenticated
USING (from_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create sparks"
ON public.sparks FOR INSERT
TO authenticated
WITH CHECK (from_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS: Mensajes - emisor y receptor pueden ver
CREATE POLICY "Users can see their messages"
ON public.ghost_messages FOR SELECT
TO authenticated
USING (
  from_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR to_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send one message per person"
ON public.ghost_messages FOR INSERT
TO authenticated
WITH CHECK (from_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger para crear perfil en registro
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para updated_at en profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para presencia
ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;