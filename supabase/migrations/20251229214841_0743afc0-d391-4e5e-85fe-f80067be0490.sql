-- Eliminar la política UPDATE problemática de user_subscriptions
DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.user_subscriptions;

-- Nota: No creamos una nueva política UPDATE para usuarios regulares porque:
-- 1. Las actualizaciones de suscripción deben hacerse solo por webhooks de Stripe (usando service_role que bypassa RLS)
-- 2. Permitir a usuarios actualizar sus propias suscripciones sería un riesgo de escalación de privilegios
-- El service_role bypassa RLS automáticamente, así que las edge functions de Stripe seguirán funcionando