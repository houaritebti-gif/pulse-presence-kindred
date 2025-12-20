-- Tabla de chats (conversaciones activas post-chispa)
CREATE TABLE public.spark_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Track who has "extinguished" the spark
  extinguished_by_a BOOLEAN DEFAULT false,
  extinguished_by_b BOOLEAN DEFAULT false,
  UNIQUE(profile_a_id, profile_b_id)
);

-- Tabla de mensajes del chat real
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.spark_chats(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.spark_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Solo participantes pueden ver sus chats
CREATE POLICY "Users can see their spark chats"
ON public.spark_chats FOR SELECT
TO authenticated
USING (
  profile_a_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR profile_b_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- RLS: Crear chats (para trigger/función)
CREATE POLICY "System can create spark chats"
ON public.spark_chats FOR INSERT
TO authenticated
WITH CHECK (
  profile_a_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR profile_b_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- RLS: Actualizar (para apagar chispa)
CREATE POLICY "Users can update their spark chats"
ON public.spark_chats FOR UPDATE
TO authenticated
USING (
  profile_a_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR profile_b_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- RLS: Mensajes - solo participantes del chat
CREATE POLICY "Users can see messages in their chats"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.spark_chats 
    WHERE (profile_a_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
           OR profile_b_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    AND extinguished_by_a = false 
    AND extinguished_by_b = false
  )
);

CREATE POLICY "Users can send messages in their chats"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND chat_id IN (
    SELECT id FROM public.spark_chats 
    WHERE (profile_a_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
           OR profile_b_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    AND extinguished_by_a = false 
    AND extinguished_by_b = false
  )
);

-- Función para detectar chispa mutua y crear chat
CREATE OR REPLACE FUNCTION public.check_mutual_spark()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  mutual_exists BOOLEAN;
  existing_chat UUID;
  ordered_a UUID;
  ordered_b UUID;
BEGIN
  -- Check if the other person also sent a ghost message
  SELECT EXISTS (
    SELECT 1 FROM public.ghost_messages
    WHERE from_profile_id = NEW.to_profile_id
    AND to_profile_id = NEW.from_profile_id
  ) INTO mutual_exists;

  IF mutual_exists THEN
    -- Order profile IDs consistently to avoid duplicates
    IF NEW.from_profile_id < NEW.to_profile_id THEN
      ordered_a := NEW.from_profile_id;
      ordered_b := NEW.to_profile_id;
    ELSE
      ordered_a := NEW.to_profile_id;
      ordered_b := NEW.from_profile_id;
    END IF;

    -- Check if chat already exists
    SELECT id INTO existing_chat
    FROM public.spark_chats
    WHERE profile_a_id = ordered_a AND profile_b_id = ordered_b;

    -- Create chat if doesn't exist
    IF existing_chat IS NULL THEN
      INSERT INTO public.spark_chats (profile_a_id, profile_b_id)
      VALUES (ordered_a, ordered_b);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para detectar chispa al enviar mensaje fantasma
CREATE TRIGGER on_ghost_message_sent
  AFTER INSERT ON public.ghost_messages
  FOR EACH ROW EXECUTE FUNCTION public.check_mutual_spark();

-- Habilitar realtime para mensajes de chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spark_chats;