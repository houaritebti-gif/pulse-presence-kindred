# KIKI - Documentación Técnica Completa

> **Última actualización:** Enero 2026  
> **Versión:** 1.0  
> **Stack:** React + Vite + TypeScript + Tailwind CSS + Supabase (Lovable Cloud)

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Base de Datos](#base-de-datos)
5. [Autenticación y Autorización](#autenticación-y-autorización)
6. [Componentes Principales](#componentes-principales)
7. [Hooks Personalizados](#hooks-personalizados)
8. [Edge Functions](#edge-functions)
9. [Sistema de Notificaciones](#sistema-de-notificaciones)
10. [Sistema de Suscripciones](#sistema-de-suscripciones)
11. [Gamificación](#gamificación)
12. [Seguridad](#seguridad)
13. [PWA y Offline](#pwa-y-offline)

---

## Visión General

KIKI es una plataforma de descubrimiento social diseñada para comunidades queer y neurodivergentes. La filosofía central es "aquí no hay match, hay chispa" - priorizando conexiones emocionales sobre interacciones superficiales.

### Principios de Diseño
- **Privacidad primero**: Los perfiles solo son visibles tras interacción mutua
- **Silencio como respuesta válida**: No hay presión para responder
- **Identidad revelada gradualmente**: Navegación "profile-first" (/user/:id)
- **Sin optimización prematura**: Claridad sobre complejidad

### Público Objetivo
- Comunidades LGBTQ+
- Personas neurodivergentes
- Usuarios fatigados de apps de citas tradicionales

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
├─────────────────────────────────────────────────────────────────┤
│  Components │ Hooks │ Contexts │ Pages │ Utils                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Lovable Cloud)                      │
├─────────────────────────────────────────────────────────────────┤
│  Auth │ Database │ Storage │ Realtime │ Edge Functions          │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICIOS EXTERNOS                           │
├─────────────────────────────────────────────────────────────────┤
│  Stripe (Pagos) │ Resend (Email) │ Web Push API │ Lovable AI    │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos
1. Usuario interactúa con componentes React
2. Hooks gestionan estado y llamadas a Supabase
3. RLS policies filtran datos según permisos
4. Realtime sincroniza cambios en tiempo real
5. Edge Functions manejan lógica servidor (pagos, notificaciones, AI)

---

## Estructura del Proyecto

```
src/
├── components/           # Componentes React
│   ├── ui/              # shadcn/ui components
│   └── admin/           # Panel de administración
├── contexts/            # React Contexts
│   ├── AuthContext.tsx  # Autenticación global
│   └── ChatInputContext.tsx
├── hooks/               # Custom hooks (60+)
├── pages/               # Páginas/Rutas
├── utils/               # Utilidades
├── integrations/        # Configuración Supabase
├── config/              # Configuraciones
└── constants/           # Constantes

supabase/
├── functions/           # Edge Functions (15+)
├── migrations/          # Migraciones SQL
└── config.toml          # Configuración Supabase

public/
├── sw.js               # Service Worker (PWA)
└── manifest.json       # PWA manifest
```

---

## Base de Datos

### Tablas Principales

#### Usuarios y Perfiles

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Información de usuario (nombre, bio, ciudad, preferencias) |
| `profile_photos` | Galería de fotos adicionales |
| `profile_interests` | Intereses del usuario |
| `profile_music_styles` | Estilos musicales |
| `profile_tribes` | Tribus/comunidades |
| `profile_gender_preferences` | Preferencias de género para matches |
| `user_roles` | Roles RBAC (admin, moderator, user) |
| `user_blocks` | Usuarios bloqueados |
| `user_reports` | Reportes de usuarios |

#### Sistema de Sparks

| Tabla | Descripción |
|-------|-------------|
| `ghost_messages` | Mensajes anónimos iniciales |
| `spark_chats` | Chats activos tras match mutuo |
| `chat_messages` | Mensajes dentro de spark chats |
| `sparks` | Registro de "me gusta" |
| `spark_read_status` | Estado de lectura por chat |

#### Quedadas (Eventos)

| Tabla | Descripción |
|-------|-------------|
| `quedadas` | Eventos creados por usuarios |
| `quedada_attendees` | Asistentes confirmados |
| `quedada_messages` | Chat grupal del evento |
| `quedada_message_reactions` | Reacciones a mensajes |
| `quedada_read_status` | Estado de lectura |
| `muted_quedadas` | Quedadas silenciadas |

#### Presencia y Conexiones

| Tabla | Descripción |
|-------|-------------|
| `presence` | Estado online/visible de usuarios |
| `presence_exhaustion` | Usuarios que vieron todos los perfiles |
| `pending_presence_notifications` | Cola de notificaciones pendientes |
| `connection_requests` | Solicitudes de conexión |
| `profile_visits` | Visitas a perfiles |

#### Gamificación

| Tabla | Descripción |
|-------|-------------|
| `profile_spark_energy` | Energía, racha y nivel del usuario |
| `spark_transactions` | Historial de transacciones de energía |
| `spark_purchased_items` | Items comprados en la tienda |
| `user_achievements` | Logros desbloqueados |
| `daily_challenge_progress` | Progreso de retos diarios |

#### Suscripciones

| Tabla | Descripción |
|-------|-------------|
| `user_subscriptions` | Estado de suscripción (free/plus/premium) |
| `stripe_customer_data` | Datos de cliente Stripe |
| `kiki_now_boosts` | Boosts activos de KIKI Now |

#### Verificación y Seguridad

| Tabla | Descripción |
|-------|-------------|
| `identity_verifications` | Verificaciones de identidad con IA |
| `push_subscriptions` | Suscripciones push del navegador |
| `push_rate_limits` | Rate limiting por usuario |
| `internal_secrets_rotation` | Rotación de secretos internos |
| `secrets_rotation_log` | Log de rotaciones |
| `email_alert_history` | Historial de alertas por email |

#### Notificaciones

| Tabla | Descripción |
|-------|-------------|
| `notifications` | Notificaciones in-app |
| `bio_blacklist` | Palabras prohibidas en bios |
| `cleanup_executions` | Log de ejecuciones de limpieza |

### Funciones de Base de Datos

```sql
-- Verificación de roles
has_role(user_id, role) → boolean

-- Nivel de suscripción
get_user_subscription_tier(profile_id) → subscription_tier

-- Validación de contenido
contains_blacklisted_words(text) → boolean
get_blacklisted_matches(text) → text[]

-- Cálculos de usuario
calculate_age(birthdate) → integer
get_spark_level(total_earned) → integer
get_today_earned_energy(profile_id) → integer

-- Permisos de visualización
can_view_profile(viewer_user_id, target_profile_id) → boolean
get_connection_status(viewer_user_id, target_profile_id) → text

-- Boost KIKI Now
has_active_kiki_now_boost(profile_id) → boolean

-- Rate limiting
check_push_rate_limit(profile_id, max_requests, window_minutes) → boolean
cleanup_old_rate_limits() → integer

-- Tienda de items
get_available_item_quantity(profile_id, item_key) → integer
use_purchased_item(profile_id, item_key) → boolean

-- Secretos internos
generate_internal_secret() → text
rotate_internal_secret(secret_name) → text
validate_internal_secret(secret_name, provided_secret) → boolean
```

### Triggers

| Trigger | Tabla | Función |
|---------|-------|---------|
| `on_auth_user_created` | auth.users | Crea perfil automáticamente |
| `validate_profile_bio` | profiles | Valida palabras prohibidas |
| `invalidate_identity_on_avatar_change` | profiles | Invalida verificación si cambia avatar |
| `sync_email_verified` | auth.users | Sincroniza estado de email |
| `check_mutual_spark` | ghost_messages | Detecta matches mutuos |
| `handle_new_connection_request` | connection_requests | Notifica solicitudes |
| `handle_connection_accepted` | connection_requests | Notifica aceptaciones |
| `handle_premium_ghost_message` | ghost_messages | Notifica mensajes premium |
| `handle_profile_visit_notification` | profile_visits | Notifica visitas |
| `notify_exhausted_users_on_new_presence` | presence | Notifica nuevos usuarios |

---

## Autenticación y Autorización

### Flujo de Autenticación

```
1. Usuario accede a /auth
2. Ingresa email/password o usa OAuth
3. Supabase Auth valida credenciales
4. Se crea sesión JWT
5. AuthContext almacena estado global
6. Trigger crea perfil si es nuevo usuario
```

### Contexto de Autenticación

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email, password) => Promise<void>;
  signUp: (email, password) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### Sistema RBAC

```typescript
// Roles disponibles
type AppRole = 'admin' | 'moderator' | 'user';

// Hooks de verificación
useUserRole()      // Obtiene roles del usuario
useIsAdmin()       // Verifica si es admin
useIsModerator()   // Verifica si es moderador
useHasRole(role)   // Verifica rol específico
```

### RLS Policies

Todas las tablas tienen Row Level Security habilitado. Políticas principales:

```sql
-- Usuarios solo ven sus propios datos
CREATE POLICY "Users can view own data" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Función can_view_profile controla visibilidad
CREATE POLICY "Users can view allowed profiles" ON profiles
  FOR SELECT USING (can_view_profile(auth.uid(), id));

-- Admin tiene acceso total
CREATE POLICY "Admins have full access" ON user_reports
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

## Componentes Principales

### Navegación

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `BottomNavigation` | Global | Navegación inferior móvil |
| `AnimatedRoutes` | App.tsx | Transiciones entre páginas |
| `ProtectedRoute` | Rutas | Protege rutas autenticadas |
| `AdminRoute` | Admin | Protege rutas de admin |

### Presencia (Swipe Cards)

| Componente | Descripción |
|------------|-------------|
| `FullScreenPresenceList` | Lista de cards deslizables |
| `FullScreenPresenceCard` | Card individual con foto y acciones |
| `PresenceActionButtons` | Botones de acción (spark, skip, super) |
| `SwipeTutorial` | Tutorial de gestos |
| `VirtualizedPresenceList` | Lista optimizada para scroll |

### Chat y Mensajería

| Componente | Descripción |
|------------|-------------|
| `SparkChat` | Chat 1:1 tras match |
| `QuedadaChat` | Chat grupal de eventos |
| `TypingIndicator` | Indicador de escritura |
| `MessageReactions` | Reacciones con emojis |
| `VoiceRecordButton` | Grabación de audio |
| `VoiceMessagePlayer` | Reproductor de audio |

### Perfiles

| Componente | Descripción |
|------------|-------------|
| `ProfilePhotoGallery` | Galería de fotos |
| `ProfilePhotoManager` | Gestión de fotos |
| `ProfileCompletenessCard` | Indicador de completitud |
| `ProfileStatsCard` | Estadísticas del perfil |
| `IdentityVerificationCard` | Verificación con selfie |
| `PublicAchievementsBadges` | Insignias públicas |

### Gamificación

| Componente | Descripción |
|------------|-------------|
| `SparkFlame` | Indicador de energía con llama |
| `SparkShop` | Tienda de items |
| `AchievementBadge` | Insignia individual |
| `AchievementsDisplay` | Grid de logros |
| `LevelUpCelebration` | Animación de subida de nivel |
| `DailyChallengesCard` | Retos diarios |
| `ChallengeStreakCalendar` | Calendario de racha |

### Notificaciones

| Componente | Descripción |
|------------|-------------|
| `NotificationProvider` | Provider global |
| `PushNotificationToggle` | Toggle de push |
| `SwipeableNotification` | Notificación deslizable |
| `OfflineIndicator` | Indicador sin conexión |

### Admin

| Componente | Descripción |
|------------|-------------|
| `AdminDashboard` | Dashboard principal |
| `AdminStatsCard` | Tarjeta de estadísticas |
| `AdminUserCard` | Gestión de usuarios |
| `AdminReportCard` | Gestión de reportes |
| `AdminVerificationCard` | Verificaciones pendientes |
| `AdminActivityChart` | Gráfico de actividad |
| `AdminNotificationTestCenter` | Centro de pruebas |

---

## Hooks Personalizados

### Autenticación y Perfil

| Hook | Descripción |
|------|-------------|
| `useProfile` | Datos del perfil actual |
| `usePublicProfile` | Perfil público de otro usuario |
| `useUserRole` | Roles RBAC del usuario |
| `useIsAdmin` | Verificación de admin |
| `useProfileCompleteness` | % de completitud del perfil |
| `useProfilePhotos` | Gestión de galería de fotos |
| `useIdentityVerification` | Estado de verificación |

### Presencia y Descubrimiento

| Hook | Descripción |
|------|-------------|
| `usePresence` | Estado online y visibilidad |
| `useOnlineStatus` | Detección de conexión |
| `useVisitedProfiles` | Perfiles ya visitados |
| `useProfileVisits` | Visitas recibidas |
| `useProfilePrefetch` | Precarga de perfiles |

### Sparks y Mensajería

| Hook | Descripción |
|------|-------------|
| `useSparks` | Gestión de likes/sparks |
| `useSparkDetection` | Detección de matches |
| `useNewSparks` | Nuevos matches |
| `useReceivedGhostMessages` | Mensajes recibidos |
| `useTypingIndicator` | Estado de escritura |
| `useGroupTypingIndicator` | Escritura en grupos |
| `useChatImageUpload` | Subida de imágenes |
| `useVoiceRecorder` | Grabación de voz |

### Quedadas

| Hook | Descripción |
|------|-------------|
| `useQuedadas` | CRUD de eventos |
| `useQuedadaReactions` | Reacciones a mensajes |
| `useMutedQuedadas` | Silencios de quedadas |

### Gamificación

| Hook | Descripción |
|------|-------------|
| `useSparkEnergy` | Energía y transacciones |
| `useAchievements` | Logros del usuario |
| `useAchievementChecker` | Verificación automática |
| `useDailyChallenges` | Retos diarios |
| `useDailyLoginReward` | Recompensa diaria |
| `useChallengeStreak` | Racha de retos |
| `usePurchasedItems` | Items comprados |
| `useLevelUpCelebration` | Celebración de nivel |

### Suscripción

| Hook | Descripción |
|------|-------------|
| `useSubscription` | Estado de suscripción |
| `useUserSubscription` | Datos de suscripción |
| `useRewindLimit` | Límite de rebobinados |
| `useKikiNow` | Boost KIKI Now |

### Conexiones y Social

| Hook | Descripción |
|------|-------------|
| `useConnectionRequests` | Solicitudes de conexión |
| `useUserModeration` | Bloqueos y reportes |
| `useGenderPreferences` | Preferencias de género |
| `useInterests` | Intereses del usuario |

### Notificaciones

| Hook | Descripción |
|------|-------------|
| `useNotifications` | Notificaciones in-app |
| `useNotificationCenter` | Centro de notificaciones |
| `usePushNotifications` | Push del navegador |
| `useNavBadgeCounts` | Contadores de badges |

### UI y UX

| Hook | Descripción |
|------|-------------|
| `useMobile` | Detección de móvil |
| `useReducedMotion` | Preferencia de movimiento |
| `useKeyboardShortcuts` | Atajos de teclado |
| `usePullToRefresh` | Pull to refresh |
| `useInfiniteScroll` | Scroll infinito |
| `useLocalStorage` | Persistencia local |
| `useTutorial` | Estado de tutoriales |

---

## Edge Functions

### Pagos y Suscripciones

| Función | Descripción |
|---------|-------------|
| `create-checkout` | Crea sesión de Stripe Checkout |
| `check-subscription` | Verifica estado de suscripción |
| `customer-portal` | Abre portal de cliente Stripe |
| `stripe-webhook` | Procesa webhooks de Stripe |
| `create-kiki-now-checkout` | Checkout para boost KIKI Now |
| `verify-kiki-now-boost` | Verifica pago de boost |
| `trial-reminders` | Envía recordatorios de trial |

### Notificaciones

| Función | Descripción |
|---------|-------------|
| `send-push-notification` | Envía push notification |
| `daily-presence-summary` | Resumen diario de presencia |
| `notify-high-compatibility` | Notifica alta compatibilidad |
| `rate-limit-alert-email` | Email de alerta rate limit |

### Verificación

| Función | Descripción |
|---------|-------------|
| `verify-identity` | Verifica identidad con IA |
| `cleanup-identity-selfies` | Limpia selfies antiguas |

### Seguridad

| Función | Descripción |
|---------|-------------|
| `rotate-internal-secret` | Rota secretos internos |

### IA

| Función | Descripción |
|---------|-------------|
| `ai-chat` | Chatbot con Lovable AI |

### Estructura de Edge Function

```typescript
// supabase/functions/nombre-funcion/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Crear cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lógica de la función...

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## Sistema de Notificaciones

### Tipos de Notificación

| Tipo | Descripción |
|------|-------------|
| `spark_match` | Match mutuo detectado |
| `ghost_message` | Mensaje anónimo recibido |
| `premium_ghost_message` | Mensaje premium recibido |
| `super_spark` | Super Spark recibido |
| `connection_request` | Solicitud de conexión |
| `connection_accepted` | Conexión aceptada |
| `quedada_invite` | Invitación a quedada |
| `quedada_message` | Mensaje en quedada |
| `profile_visit` | Visita al perfil |
| `identity_verified` | Identidad verificada |
| `identity_rejected` | Verificación rechazada |
| `identity_invalidated` | Verificación invalidada |
| `achievement_unlocked` | Logro desbloqueado |
| `level_up` | Subida de nivel |
| `trial_ending` | Trial por expirar |
| `presence_summary` | Resumen diario |

### Flujo de Push Notification

```
1. Trigger detecta evento (nuevo mensaje, match, etc.)
2. Trigger llama a send-push-notification vía net.http_post
3. Edge function valida rate limit y secreto interno
4. Se envía push a todos los endpoints del usuario
5. Endpoints inválidos se eliminan automáticamente
```

### Rate Limiting

- **Límite**: 30 requests/minuto por perfil
- **Ventana**: 1 minuto (truncado)
- **Cleanup**: Registros > 1 hora eliminados automáticamente

---

## Sistema de Suscripciones

### Tiers

| Tier | Precio | Características |
|------|--------|-----------------|
| **Free** | €0 | 2 rebobinados/semana, funciones básicas |
| **Plus** | €4.99/mes | 10 rebobinados/semana, chatbot IA |
| **Premium** | €9.99/mes | Rebobinados ilimitados, crear quedadas |

### Trial

- **Duración**: 3 días
- **Tier**: Plus
- **Límite**: 1 trial por usuario
- **Recordatorio**: 2 días antes de expirar

### Flujo de Pago

```
1. Usuario selecciona tier en /subscription
2. createCheckoutMutation llama a create-checkout
3. Edge function crea sesión Stripe
4. Usuario completa pago en Stripe Checkout
5. Webhook stripe-webhook recibe confirmación
6. Se actualiza user_subscriptions
7. Usuario redirigido a /subscription?success=true
```

### KIKI Now Boost

- **Precio**: €2.99 (pago único)
- **Duración**: 1 hora
- **Efecto**: Prioridad en lista de presencia + badge especial

---

## Gamificación

### Spark Energy

Sistema de puntos virtuales para recompensar actividad.

#### Niveles

| Nivel | Nombre | Energía Requerida |
|-------|--------|-------------------|
| 1 | Brasas | 0 |
| 2 | Llama | 500 |
| 3 | Fuego | 1,500 |
| 4 | Hoguera | 3,500 |
| 5 | Radiante | 7,000 |

#### Formas de Ganar

| Acción | Energía |
|--------|---------|
| Login diario | 5-20 (según racha) |
| Completar perfil | Variable |
| Enviar ghost message | 5 |
| Recibir respuesta | 10 |
| Match mutuo | 25 |
| Reto diario | 10-50 |
| Logro desbloqueado | 25-100 |

### Tienda de Items

| Item | Costo | Efecto |
|------|-------|--------|
| Super Spark | 50 | Mensaje destacado |
| Mensaje Premium | 30 | Notificación especial |
| Segunda Oportunidad | 25 | Volver a contactar |

### Logros

35+ logros en categorías:
- **Perfil**: Completar secciones
- **Social**: Conexiones y matches
- **Actividad**: Uso diario, rachas
- **Eventos**: Participar en quedadas
- **Premium**: Acciones premium

### Retos Diarios

3 retos aleatorios cada día:
- Completar perfil
- Enviar mensajes
- Visitar perfiles
- Ver presencia

---

## Seguridad

### RLS (Row Level Security)

Todas las tablas tienen políticas RLS activas que restringen:
- Lectura de datos propios
- Escritura solo en recursos propios
- Acceso admin a recursos globales

### Secretos Internos

Sistema de rotación automática de secretos para comunicación entre triggers y edge functions.

```sql
-- Rotación cada 90 días
-- Grace period de 24 horas tras rotación
-- Log de todas las rotaciones
```

### Rate Limiting

| Recurso | Límite |
|---------|--------|
| Push notifications | 30/min por usuario |
| Ghost messages | 10/día para free |
| API general | Límites de Supabase |

### Validación de Contenido

- Blacklist de palabras en bios
- Verificación de identidad con IA
- Moderación de reportes

### Protección de Datos Sensibles

- `stripe_customer_data`: Solo accesible vía service_role
- `user_subscriptions`: Sin updates directos
- `push_subscriptions`: Solo propietario puede CRUD
- Keys de push encriptadas en tránsito

---

## PWA y Offline

### Service Worker

```javascript
// public/sw.js
- Cache de assets estáticos
- Manejo de push notifications
- Notificación de nuevo contenido
```

### Características PWA

- Instalable en dispositivo
- Icono en home screen
- Splash screen personalizado
- Modo offline básico

### Push Notifications

- VAPID keys para autenticación
- Soporte multi-dispositivo
- Limpieza automática de endpoints inválidos

### IndexedDB

- `offlineQueueDB`: Cola de mensajes offline
- `profileCacheDB`: Cache de perfiles visitados

---

## Variables de Entorno

### Frontend (.env)

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxx
```

### Backend (Supabase Secrets)

```
STRIPE_SECRET_KEY          # Stripe API key
RESEND_API_KEY            # Email service
VAPID_PUBLIC_KEY          # Push notifications
VAPID_PRIVATE_KEY         # Push notifications
LOVABLE_API_KEY           # AI chat
INTERNAL_FUNCTION_SECRET  # Legacy (deprecated)
```

---

## Comandos de Desarrollo

```bash
# Desarrollo local
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

---

## Despliegue

1. **Desarrollo**: Push a rama → Deploy automático en Lovable
2. **Producción**: Publicar manualmente desde Lovable UI
3. **Dominio**: kikicommunity.com (configurado en Lovable)

---

## Contacto y Soporte

- **Email**: weribouchakour@gmail.com
- **Admin Dashboard**: /admin (requiere rol admin)

---

*Documentación generada para KIKI v1.0 - Enero 2026*
