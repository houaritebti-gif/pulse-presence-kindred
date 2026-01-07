-- =============================================
-- SISTEMA "TU CHISPA" - Energía Personal
-- =============================================

-- Tabla principal de energía del perfil
CREATE TABLE public.profile_spark_energy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_energy INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Solo una entrada por perfil
  CONSTRAINT profile_spark_energy_profile_unique UNIQUE (profile_id),
  
  -- Energía no puede ser negativa
  CONSTRAINT positive_energy CHECK (current_energy >= 0),
  CONSTRAINT positive_total CHECK (total_earned >= 0),
  CONSTRAINT positive_streak CHECK (current_streak >= 0)
);

-- Tabla de transacciones de energía
CREATE TABLE public.spark_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ÍNDICES
-- =============================================

-- Índice para búsqueda rápida por perfil
CREATE INDEX idx_spark_energy_profile ON public.profile_spark_energy(profile_id);

-- Índices para transacciones
CREATE INDEX idx_spark_transactions_profile ON public.spark_transactions(profile_id);
CREATE INDEX idx_spark_transactions_profile_date ON public.spark_transactions(profile_id, created_at DESC);
CREATE INDEX idx_spark_transactions_action ON public.spark_transactions(action);
CREATE INDEX idx_spark_transactions_type ON public.spark_transactions(type);

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger para actualizar updated_at en profile_spark_energy
CREATE TRIGGER update_spark_energy_updated_at
  BEFORE UPDATE ON public.profile_spark_energy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profile_spark_energy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spark_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para profile_spark_energy
CREATE POLICY "Users can view their own spark energy"
  ON public.profile_spark_energy
  FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own spark energy"
  ON public.profile_spark_energy
  FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own spark energy"
  ON public.profile_spark_energy
  FOR UPDATE
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Políticas para spark_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.spark_transactions
  FOR SELECT
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own transactions"
  ON public.spark_transactions
  FOR INSERT
  WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- =============================================
-- FUNCIÓN HELPER: Obtener nivel de chispa
-- =============================================

CREATE OR REPLACE FUNCTION public.get_spark_level(p_total_earned INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_total_earned >= 7000 THEN 5  -- Radiante
    WHEN p_total_earned >= 3500 THEN 4  -- Hoguera
    WHEN p_total_earned >= 1500 THEN 3  -- Fuego
    WHEN p_total_earned >= 500 THEN 2   -- Llama
    ELSE 1                               -- Brasas
  END
$$;

-- =============================================
-- FUNCIÓN HELPER: Calcular energía ganada hoy
-- =============================================

CREATE OR REPLACE FUNCTION public.get_today_earned_energy(p_profile_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM public.spark_transactions
  WHERE profile_id = p_profile_id
    AND type = 'earn'
    AND created_at >= CURRENT_DATE
$$;