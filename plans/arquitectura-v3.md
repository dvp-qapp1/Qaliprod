# Arquitectura Qalia Next.js - V3 (Production-Ready)

> **Arquitectura definitiva** con mejores prácticas de desarrollo, testing, seguridad y escalabilidad.

---

## Índice

1. [Visión General](#visión-general)
2. [Principios de Arquitectura](#principios-de-arquitectura)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Patrones de Código](#patrones-de-código)
6. [Database Schema](#database-schema)
7. [Autenticación y Seguridad](#autenticación-y-seguridad)
8. [Sistema de Resiliencia](#sistema-de-resiliencia)
9. [Sistema de Monetización](#sistema-de-monetización)
10. [Integración con Gemini AI](#integración-con-gemini-ai)
11. [Patrones de Frontend](#patrones-de-frontend)
12. [Testing Strategy (TDD)](#testing-strategy-tdd)
13. [Monitoring y Observabilidad](#monitoring-y-observabilidad)
14. [Plan de Implementación](#plan-de-implementación)
15. [Architecture Decision Records](#architecture-decision-records)

---

## Visión General

**Qalia** es una aplicación de nutrición con IA que permite:
- Analizar comidas con foto (Gemini Vision)
- Chatear con coach nutricional (Kili)
- Trackear progreso con analytics visuales
- Modelo freemium/premium con Polar.sh

---

## Principios de Arquitectura

### 1. Modularity & Separation of Concerns
- Single Responsibility Principle
- High cohesion, low coupling
- Clear interfaces between components
- Many small files (200-400 lines typical, 800 max)

### 2. Type Safety End-to-End
- TypeScript strict mode everywhere
- Zod validation at boundaries
- Generated types from Supabase
- No `any` types allowed

### 3. Server-First Security
- API keys protected with runtime checks
- Row Level Security (RLS) on all tables
- Input validation with Zod schemas
- Defense in depth

### 4. Resilience by Default
- Circuit breakers for external services
- Rate limiting per user/tier
- Graceful degradation with feature flags
- Health checks for monitoring

### 5. Test-Driven Development
- Tests before implementation (TDD)
- 80%+ code coverage minimum
- Unit, Integration, and E2E tests
- Semantic test selectors

### 6. Immutability Pattern

```typescript
// ALWAYS use spread operator
const updatedUser = { ...user, name: 'New Name' }
const updatedArray = [...items, newItem]

// NEVER mutate directly
user.name = 'New Name'  // BAD
items.push(newItem)     // BAD
```

---

## Stack Tecnológico

### Core Framework
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict) | 5.x |
| Runtime | React | 19 |
| Styling | Tailwind CSS | v4 |

### Backend & Database
| Component | Technology | Purpose |
|-----------|------------|---------|
| BaaS | Supabase | Auth + Database + Storage |
| Types | Supabase CLI | Auto-generated types |
| AI | Google Gemini 2.0 Flash | Image analysis (server-only) |
| Payments | Polar.sh | Merchant of Record |
| Rate Limiting | Upstash Redis | Per-user limits |

### State & Data
| Component | Technology | Purpose |
|-----------|------------|---------|
| Server State | React Query | Fetch, retry, cache |
| Client State | Zustand | Minimal UI state |
| Forms | React Hook Form + Zod | Validation |

### Quality & DevOps
```bash
# Linting & formatting
bun add -D @biomejs/biome

# Type-safe env validation
bun add @t3-oss/env-nextjs zod

# Git hooks
bun add -D husky @commitlint/{cli,config-conventional}

# Rate limiting
bun add @upstash/ratelimit @upstash/redis

# Error tracking
bun add @sentry/nextjs
```

---

## Estructura del Proyecto

```
qalia-nextjs-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── gemini/
│   │   │   │   └── analyze-image/
│   │   │   │       ├── route.ts
│   │   │   │       └── route.test.ts
│   │   │   ├── customer/
│   │   │   └── health/
│   │   ├── (auth)/              # Auth-protected routes
│   │   ├── checkout/
│   │   └── portal/
│   ├── components/
│   │   ├── ui/                  # Base UI components
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── Button.test.tsx
│   │   │   └── Card/
│   │   ├── features/            # Feature-specific components
│   │   │   ├── meals/
│   │   │   └── chat/
│   │   └── shared/
│   │       └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── gemini/
│   │   │   ├── client.ts        # Runtime check included
│   │   │   ├── circuit-breaker.ts
│   │   │   └── rate-limiter.ts
│   │   ├── polar/
│   │   └── resilience/
│   │       ├── circuit-breaker.ts
│   │       └── feature-flags.ts
│   ├── services/                # Business logic layer
│   │   ├── geminiService.ts
│   │   └── mealService.ts
│   ├── repositories/            # Data access layer
│   │   ├── mealRepository.ts
│   │   └── profileRepository.ts
│   ├── hooks/
│   │   ├── useMeals.ts
│   │   └── useDebounce.ts
│   ├── stores/
│   │   └── uiStore.ts
│   └── types/
│       ├── supabase.ts          # Auto-generated
│       └── api.types.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_performance_indices.sql
│   │   └── 003_analytics_triggers.sql
│   └── scripts/
│       ├── backup.sh
│       └── restore.sh
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│       ├── meals.spec.ts
│       └── auth.spec.ts
├── AGENTS.md
├── CLAUDE.md
├── env.ts
└── .env.example
```

---

## Patrones de Código

### Repository Pattern (Data Access)

```typescript
// repositories/mealRepository.ts
import { supabase } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Meal = Database['public']['Tables']['meals']['Row']
type CreateMealDto = Database['public']['Tables']['meals']['Insert']

interface MealFilters {
  userId: string
  startDate?: Date
  endDate?: Date
  limit?: number
}

export const mealRepository = {
  async findAll(filters: MealFilters): Promise<Meal[]> {
    let query = supabase
      .from('meals')
      .select('id, name, calories, protein, carbs, fat, meal_time, created_at')
      .eq('user_id', filters.userId)
      .order('created_at', { ascending: false })

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async create(meal: CreateMealDto): Promise<Meal> {
    const { data, error } = await supabase
      .from('meals')
      .insert(meal)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}
```

### Service Layer (Business Logic)

```typescript
// services/mealService.ts
import { mealRepository } from '@/repositories/mealRepository'
import { geminiService } from '@/services/geminiService'
import type { CreateMealDto, AnalyzedMeal } from '@/types/api.types'

export const mealService = {
  async analyzeAndSave(
    imageBase64: string, 
    userId: string
  ): Promise<AnalyzedMeal> {
    // 1. Analyze with AI
    const analysis = await geminiService.analyzeFoodImage(imageBase64, userId)

    // 2. Save to database
    const meal = await mealRepository.create({
      user_id: userId,
      name: analysis.name,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      ingredients: analysis.ingredients,
      meal_time: new Date().toISOString()
    })

    return { ...meal, suggestions: analysis.suggestions }
  },

  async getMealHistory(userId: string, days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return mealRepository.findAll({
      userId,
      startDate,
      limit: 100
    })
  }
}
```

### API Response Format

```typescript
// types/api.types.ts
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

// Usage in API routes
return NextResponse.json({
  success: true,
  data: meals,
  meta: { total: 100, page: 1, limit: 10 }
})

// Error response
return NextResponse.json({
  success: false,
  error: 'Validation failed'
}, { status: 400 })
```

### Centralized Error Handler

```typescript
// lib/errors/handler.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export function errorHandler(error: unknown, context?: Record<string, unknown>) {
  // Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    }, { status: 400 })
  }

  // Operational errors (expected)
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: error.statusCode })
  }

  // Unexpected errors - log to Sentry
  Sentry.captureException(error, { contexts: { custom: context } })

  return NextResponse.json({
    success: false,
    error: 'Internal server error'
  }, { status: 500 })
}
```

---

## Database Schema

### PostgreSQL Best Practices Applied

```sql
-- supabase/migrations/001_initial_schema.sql

-- Use proper data types
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  
  -- Personal info
  age INTEGER CHECK (age > 0 AND age < 150),
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_cm NUMERIC(5,2) CHECK (height_cm > 0),
  weight_kg NUMERIC(5,2) CHECK (weight_kg > 0),
  
  -- Goals
  goal TEXT CHECK (goal IN ('lose_weight', 'gain_muscle', 'maintain', 'eat_healthy')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  target_calories INTEGER CHECK (target_calories > 0),
  
  -- Subscription cache (updated via webhook)
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps with timezone
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  calories NUMERIC(8,2) NOT NULL CHECK (calories >= 0),
  protein NUMERIC(8,2) NOT NULL CHECK (protein >= 0),
  carbs NUMERIC(8,2) NOT NULL CHECK (carbs >= 0),
  fat NUMERIC(8,2) NOT NULL CHECK (fat >= 0),
  
  image_url TEXT,
  ingredients TEXT[] DEFAULT '{}',
  safety_status TEXT CHECK (safety_status IN ('safe', 'warning', 'danger')),
  
  meal_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Aggregated daily calories (updated via trigger)
CREATE TABLE daily_calories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  total_calories NUMERIC(10,2) DEFAULT 0,
  protein NUMERIC(10,2) DEFAULT 0,
  carbs NUMERIC(10,2) DEFAULT 0,
  fat NUMERIC(10,2) DEFAULT 0,
  meals_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, date)
);
```

### Performance Indices

```sql
-- supabase/migrations/002_performance_indices.sql

-- Meals: common query patterns
CREATE INDEX idx_meals_user_created ON meals (user_id, created_at DESC);
CREATE INDEX idx_meals_user_meal_time ON meals (user_id, meal_time);
CREATE INDEX idx_meals_user_safety ON meals (user_id, safety_status) 
  WHERE safety_status IS NOT NULL;

-- Daily calories: analytics queries
CREATE INDEX idx_daily_user_date ON daily_calories (user_id, date DESC);

-- Profiles: active users only
CREATE INDEX idx_profiles_active ON profiles (user_id) 
  WHERE deleted_at IS NULL;

-- Partial index for subscription tier queries
CREATE INDEX idx_profiles_premium ON profiles (subscription_tier) 
  WHERE subscription_tier != 'free';
```

### Analytics Trigger

```sql
-- supabase/migrations/003_analytics_triggers.sql

CREATE OR REPLACE FUNCTION update_daily_calories_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_calories (user_id, date, total_calories, protein, carbs, fat, meals_count)
  VALUES (
    NEW.user_id,
    DATE(NEW.meal_time),
    NEW.calories,
    NEW.protein,
    NEW.carbs,
    NEW.fat,
    1
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_calories = daily_calories.total_calories + EXCLUDED.total_calories,
    protein = daily_calories.protein + EXCLUDED.protein,
    carbs = daily_calories.carbs + EXCLUDED.carbs,
    fat = daily_calories.fat + EXCLUDED.fat,
    meals_count = daily_calories.meals_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_meals_to_daily_calories
  AFTER INSERT ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_calories_on_insert();
```

### Generate Types

```bash
# Run after each migration
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

---

## Autenticación y Seguridad

### Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_calories ENABLE ROW LEVEL SECURITY;

-- Profiles: users access own data only
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- Soft delete only - prevent hard delete
CREATE POLICY "Prevent profile deletion"
  ON profiles FOR DELETE
  USING (false);

-- Meals: full CRUD for own meals
CREATE POLICY "Users view own meals"
  ON meals FOR SELECT
  USING ((SELECT auth.uid()) = (SELECT user_id FROM profiles WHERE id = meals.user_id));

CREATE POLICY "Users insert own meals"
  ON meals FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = (SELECT user_id FROM profiles WHERE id = meals.user_id));

CREATE POLICY "Users delete own meals"
  ON meals FOR DELETE
  USING ((SELECT auth.uid()) = (SELECT user_id FROM profiles WHERE id = meals.user_id));

-- Storage policies for meal images
CREATE POLICY "Users upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meal-images' AND 
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "Users view own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'meal-images' AND 
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
```

### Input Validation with Zod

```typescript
// lib/validations/meal.schema.ts
import { z } from 'zod'

export const analyzeImageSchema = z.object({
  imageBase64: z.string()
    .min(1, 'Image is required')
    .refine(
      (val) => val.length < 10_000_000, 
      'Image too large (max 10MB)'
    )
})

export const createMealSchema = z.object({
  name: z.string().min(1).max(200),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  mealTime: z.string().datetime()
})

export type AnalyzeImageInput = z.infer<typeof analyzeImageSchema>
export type CreateMealInput = z.infer<typeof createMealSchema>
```

---

## Sistema de Resiliencia

### Gemini Client with Runtime Check

```typescript
// lib/gemini/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '@/env'

// CRITICAL: Prevent client-side import
if (typeof window !== 'undefined') {
  throw new Error('Gemini client cannot be imported on client side')
}

if (!env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined')
}

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
export const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
```

### Circuit Breaker Pattern

```typescript
// lib/resilience/circuit-breaker.ts

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerConfig {
  failureThreshold: number
  successThreshold: number
  timeout: number
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures = 0
  private successes = 0
  private lastFailTime = 0

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60_000
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime >= this.config.timeout) {
        this.state = 'HALF_OPEN'
        this.successes = 0
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successes++
      if (this.successes >= this.config.successThreshold) {
        this.reset()
      }
    } else {
      this.failures = 0
    }
  }

  private onFailure() {
    this.failures++
    this.lastFailTime = Date.now()

    if (this.state === 'HALF_OPEN' || this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  private reset() {
    this.state = 'CLOSED'
    this.failures = 0
    this.successes = 0
  }

  getState(): CircuitState {
    return this.state
  }
}

// Global instances
export const geminiCircuitBreaker = new CircuitBreaker('gemini-api')
export const supabaseCircuitBreaker = new CircuitBreaker('supabase-api', {
  failureThreshold: 10,
  successThreshold: 3,
  timeout: 30_000
})
```

### Rate Limiting per User/Tier

```typescript
// lib/gemini/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

type SubscriptionTier = 'free' | 'premium' | 'pro'

const TIER_LIMITS = {
  free: { requests: 10, window: '1 m' },
  premium: { requests: 50, window: '1 m' },
  pro: { requests: 200, window: '1 m' }
} as const

export function createRateLimiter(tier: SubscriptionTier) {
  const config = TIER_LIMITS[tier]
  
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `qalia:ratelimit:${tier}`
  })
}

export async function checkRateLimit(userId: string, tier: SubscriptionTier) {
  const limiter = createRateLimiter(tier)
  const { success, remaining, reset } = await limiter.limit(userId)
  
  return { 
    allowed: success, 
    remaining, 
    resetAt: new Date(reset) 
  }
}
```

### Feature Flags

```typescript
// lib/resilience/feature-flags.ts

function getFlag(envVar: string, defaultValue: boolean): boolean {
  const value = process.env[envVar]
  if (value === undefined) return defaultValue
  return value === 'true'
}

export const FEATURES = {
  ANALYTICS_TRIGGERS: getFlag('ENABLE_ANALYTICS_TRIGGERS', true),
  GEMINI_RATE_LIMIT: getFlag('ENABLE_GEMINI_RATE_LIMIT', true),
  PWA_OFFLINE: getFlag('ENABLE_PWA_OFFLINE', false),
  COMMUNITY_FEATURES: getFlag('ENABLE_COMMUNITY_FEATURES', false)
} as const
```

---

## Sistema de Monetización

### Modelo de Pricing

| Tier | Precio | Análisis/mes | Chat | Rate Limit |
|------|--------|--------------|------|------------|
| **Free** | $0 | 10 | No | 10 req/min |
| **Premium** | $9.99 | 100 | Yes | 50 req/min |
| **Pro** | $19.99 | Unlimited | Yes | 200 req/min |

### Polar.sh Integration

```typescript
// lib/polar/check-limits.ts
import { Polar } from '@polar-sh/sdk'
import { env } from '@/env'

const polar = new Polar({ accessToken: env.POLAR_ACCESS_TOKEN })

export async function checkMealAnalysisLimit(userId: string) {
  const { allowed, balance } = await polar.customers.getBalance(userId, {
    meterId: 'meal-analysis'
  })
  
  return { allowed: balance > 0, balance }
}

export async function recordMealAnalysis(userId: string) {
  await polar.usage.record({
    customerId: userId,
    meterId: 'meal-analysis',
    value: 1
  })
}
```

---

## Integración con Gemini AI

### Production-Ready Service

```typescript
// services/geminiService.ts
import { model } from '@/lib/gemini/client'
import { geminiCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { checkRateLimit } from '@/lib/gemini/rate-limiter'
import type { SubscriptionTier } from '@/types/api.types'

interface FoodAnalysis {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  suggestions: string[]
}

export const geminiService = {
  async analyzeFoodImage(
    imageBase64: string, 
    userId: string,
    tier: SubscriptionTier = 'free'
  ): Promise<FoodAnalysis> {
    // 1. Rate limit check
    const { allowed, remaining } = await checkRateLimit(userId, tier)
    if (!allowed) {
      throw new Error('Rate limit exceeded')
    }

    // 2. Circuit breaker protection
    return geminiCircuitBreaker.execute(async () => {
      const result = await model.generateContent([
        `Analyze this food image and return JSON with: 
         name (string), calories (number), protein (number), 
         carbs (number), fat (number), ingredients (string[]), 
         suggestions (string[])`,
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
      ])

      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini')
      }
      
      return JSON.parse(jsonMatch[0]) as FoodAnalysis
    })
  }
}
```

### API Route with Full Error Handling

```typescript
// app/api/gemini/analyze-image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/supabase/server'
import { checkMealAnalysisLimit, recordMealAnalysis } from '@/lib/polar/check-limits'
import { geminiService } from '@/services/geminiService'
import { mealRepository } from '@/repositories/mealRepository'
import { analyzeImageSchema } from '@/lib/validations/meal.schema'
import { errorHandler, ApiError } from '@/lib/errors/handler'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 1. Authentication
    const { data: { user } } = await auth.getUser()
    if (!user) {
      throw new ApiError(401, 'Unauthorized')
    }

    // 2. Get user profile for tier
    const profile = await profileRepository.findByUserId(user.id)
    if (!profile) {
      throw new ApiError(404, 'Profile not found')
    }

    // 3. Check Polar usage limit
    const { allowed, balance } = await checkMealAnalysisLimit(user.id)
    if (!allowed) {
      return NextResponse.json({
        success: false,
        error: 'Monthly limit reached',
        balance,
        upgradeUrl: '/pricing'
      }, { status: 429 })
    }

    // 4. Validate request body
    const body = await req.json()
    const validated = analyzeImageSchema.parse(body)

    // 5. Analyze with AI
    const analysis = await geminiService.analyzeFoodImage(
      validated.imageBase64,
      user.id,
      profile.subscription_tier
    )

    // 6. Save meal to database
    const meal = await mealRepository.create({
      user_id: profile.id,
      name: analysis.name,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      ingredients: analysis.ingredients,
      meal_time: new Date().toISOString()
    })

    // 7. Record usage
    await recordMealAnalysis(user.id)

    // 8. Track performance
    const duration = Date.now() - startTime
    Sentry.metrics.distribution('api.analyze.duration', duration)

    return NextResponse.json({
      success: true,
      data: { ...meal, suggestions: analysis.suggestions }
    })
  } catch (error) {
    return errorHandler(error, { 
      endpoint: 'analyze-image',
      duration: Date.now() - startTime 
    })
  }
}
```

---

## Patrones de Frontend

### Custom Hooks

```typescript
// hooks/useMeals.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api/client'
import type { Meal, ApiResponse } from '@/types/api.types'

export function useMeals(days: number = 7) {
  return useQuery({
    queryKey: ['meals', days],
    queryFn: () => fetchApi<Meal[]>(`/api/meals?days=${days}`),
    staleTime: 60 * 1000,
    retry: 3
  })
}

export function useAnalyzeMeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (imageBase64: string) => 
      fetchApi<Meal>('/api/gemini/analyze-image', {
        method: 'POST',
        body: JSON.stringify({ imageBase64 })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
    }
  })
}
```

### Debounce Hook

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

### Component Composition

```typescript
// components/ui/Card/Card.tsx
interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'outlined'
}

export function Card({ children, variant = 'default' }: CardProps) {
  return (
    <div className={`card card-${variant}`} data-testid="card">
      {children}
    </div>
  )
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>
}
```

### Error Boundary with Sentry

```typescript
// components/shared/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setContext('react', errorInfo)
      Sentry.captureException(error)
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## Testing Strategy (TDD)

### Test Coverage Requirements

| Type | Coverage | Purpose |
|------|----------|---------|
| Unit | 85%+ | Functions, hooks, utilities |
| Integration | 80%+ | API routes, services |
| E2E | Critical flows | User journeys |

### Unit Test Example

```typescript
// hooks/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500))
    expect(result.current).toBe('test')
  })

  it('debounces value updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })
    expect(result.current).toBe('initial')

    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current).toBe('updated')
  })

  it('cancels pending update on unmount', () => {
    const { result, unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })
    unmount()
    
    // Should not throw or cause issues
    act(() => { vi.advanceTimersByTime(500) })
  })
})
```

### Integration Test Example

```typescript
// app/api/gemini/analyze-image/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/services/geminiService')
vi.mock('@/lib/polar/check-limits')

describe('POST /api/gemini/analyze-image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(auth.getUser).mockResolvedValueOnce({ 
      data: { user: null } 
    })

    const req = new NextRequest('http://localhost/api/gemini/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'abc123' })
    })

    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid request body', async () => {
    vi.mocked(auth.getUser).mockResolvedValueOnce({ 
      data: { user: { id: 'user-123' } } 
    })

    const req = new NextRequest('http://localhost/api/gemini/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: '' }) // Empty string fails validation
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(auth.getUser).mockResolvedValueOnce({ 
      data: { user: { id: 'user-123' } } 
    })
    vi.mocked(checkMealAnalysisLimit).mockResolvedValueOnce({ 
      allowed: false, 
      balance: 0 
    })

    const req = new NextRequest('http://localhost/api/gemini/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'valid-base64' })
    })

    const response = await POST(req)
    expect(response.status).toBe(429)
  })

  it('analyzes image successfully', async () => {
    // Setup mocks
    vi.mocked(auth.getUser).mockResolvedValueOnce({ 
      data: { user: { id: 'user-123' } } 
    })
    vi.mocked(profileRepository.findByUserId).mockResolvedValueOnce({
      id: 'profile-123',
      subscription_tier: 'premium'
    })
    vi.mocked(checkMealAnalysisLimit).mockResolvedValueOnce({ 
      allowed: true, 
      balance: 50 
    })
    vi.mocked(geminiService.analyzeFoodImage).mockResolvedValueOnce({
      name: 'Grilled Chicken',
      calories: 350,
      protein: 40,
      carbs: 10,
      fat: 15,
      ingredients: ['chicken', 'olive oil'],
      suggestions: ['Add vegetables']
    })

    const req = new NextRequest('http://localhost/api/gemini/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'valid-base64-string' })
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('Grilled Chicken')
  })
})
```

### E2E Test Example (Playwright)

```typescript
// tests/e2e/meals.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Meal Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('user can analyze a meal photo', async ({ page }) => {
    // Navigate to analyze page
    await page.click('[data-testid="analyze-meal-button"]')
    
    // Upload image
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('./tests/fixtures/chicken-salad.jpg')
    
    // Wait for analysis
    await expect(page.locator('[data-testid="analysis-result"]'))
      .toBeVisible({ timeout: 30000 })
    
    // Verify results
    await expect(page.locator('[data-testid="meal-name"]'))
      .toContainText(/chicken|salad/i)
    await expect(page.locator('[data-testid="calories"]'))
      .toContainText(/\d+/)
    
    // Save meal
    await page.click('[data-testid="save-meal-button"]')
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Meal saved')
  })

  test('shows error when rate limit reached', async ({ page }) => {
    // Mock rate limit response
    await page.route('**/api/gemini/analyze-image', async (route) => {
      await route.fulfill({
        status: 429,
        body: JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded',
          upgradeUrl: '/pricing'
        })
      })
    })

    await page.click('[data-testid="analyze-meal-button"]')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('./tests/fixtures/chicken-salad.jpg')

    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Rate limit')
    await expect(page.locator('[data-testid="upgrade-link"]'))
      .toBeVisible()
  })
})
```

### Test Commands

```bash
# Unit & Integration tests
npm test                      # Run all tests
npm test -- --watch           # Watch mode
npm run test:coverage         # Coverage report

# E2E tests
npm run test:e2e              # Run Playwright tests
npm run test:e2e -- --headed  # Visual mode
```

---

## Monitoring y Observabilidad

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { geminiCircuitBreaker, supabaseCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { supabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    gemini: { state: geminiCircuitBreaker.getState() },
    supabase: { state: supabaseCircuitBreaker.getState() },
    database: await checkDatabase()
  }

  const isHealthy =
    checks.gemini.state !== 'OPEN' &&
    checks.supabase.state !== 'OPEN' &&
    checks.database.healthy

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  }, { status: isHealthy ? 200 : 503 })
}

async function checkDatabase() {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    return { healthy: !error, error: error?.message }
  } catch (e) {
    return { healthy: false, error: String(e) }
  }
}
```

### Web Vitals Tracking

```typescript
// lib/monitoring/web-vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

function sendToAnalytics(metric: Metric) {
  // Vercel Analytics
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)
    })
  }
}

export function reportWebVitals() {
  if (typeof window === 'undefined') return
  
  onCLS(sendToAnalytics)
  onFID(sendToAnalytics)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}
```

---

## Plan de Implementación

### Fases de Desarrollo

| Fase | Duración | Entregas |
|------|----------|----------|
| **0: Foundation** | 1 semana | Staging env, CI/CD, circuit breaker, feature flags, health checks |
| **1: MVP Core** | 3 semanas | Auth, meal analysis, chat, meal history |
| **2: Analytics** | 2 semanas | Dashboard, charts, daily calories triggers |
| **3: Monetization** | 2 semanas | Polar.sh integration, tier-based rate limiting |
| **4: Observability** | 1 semana | Sentry, Web Vitals, budget alerts |
| **5: Testing & Polish** | 1 semana | Unit, integration, E2E tests, UI polish |

**Total MVP monetizable:** 8-10 semanas

### Pre-Production Checklist

**Security**
- [ ] Runtime check in Gemini client
- [ ] Complete RLS policies (including Storage)
- [ ] Rate limiting with Upstash Redis
- [ ] Feature flags for rollback

**Resilience**
- [ ] Circuit breaker for Gemini
- [ ] Circuit breaker for Supabase
- [ ] Health check endpoint
- [ ] Budget tracker for Gemini API

**Monitoring**
- [ ] Sentry configured
- [ ] Web Vitals tracking
- [ ] Error boundaries in UI
- [ ] Structured logging

**Database**
- [ ] Indices for common queries
- [ ] Triggers for analytics
- [ ] Soft delete implemented
- [ ] Backup strategy

**Testing**
- [ ] 80%+ unit test coverage
- [ ] Integration tests for all API routes
- [ ] E2E tests for critical flows
- [ ] Mocks for external services

---

## Architecture Decision Records

### ADR-001: Use Upstash Redis for Rate Limiting

**Context**
Need per-user rate limiting that scales across serverless functions.

**Decision**
Use Upstash Redis with `@upstash/ratelimit` library.

**Consequences**
- *Positive*: Scales automatically, low latency, simple API
- *Negative*: Additional external dependency, cost per operation
- *Alternatives*: In-memory (not distributed), Supabase (too slow)

**Status**: Accepted

---

### ADR-002: Circuit Breaker for External Services

**Context**
Gemini API calls can fail or timeout, causing cascading failures.

**Decision**
Implement circuit breaker pattern for Gemini and Supabase calls.

**Consequences**
- *Positive*: Fail fast, prevent resource exhaustion, auto-recovery
- *Negative*: Added complexity, false positives possible
- *Alternatives*: Simple retry (insufficient), API Gateway (overkill)

**Status**: Accepted

---

### ADR-003: Database Triggers for Daily Aggregations

**Context**
Need real-time daily calorie totals without expensive queries.

**Decision**
Use PostgreSQL trigger to update `daily_calories` on meal insert.

**Consequences**
- *Positive*: O(1) read for daily totals, always consistent
- *Negative*: Write overhead, more complex debugging
- *Alternatives*: Materialized views (slower refresh), app-level compute (slower reads)

**Status**: Accepted

---

### ADR-004: Soft Delete for User Profiles

**Context**
GDPR compliance requires data recovery capability; hard deletes are risky.

**Decision**
Use `deleted_at` timestamp instead of DELETE operations.

**Consequences**
- *Positive*: Recoverable, audit trail, safer
- *Negative*: Must filter in all queries, larger table over time
- *Alternatives*: Hard delete with backups (less flexible)

**Status**: Accepted

---

## References

- [Architect Agent Guidelines](file:///Users/milumon/Documents/Github/everything-claude-code/agents/architect.md)
- [Backend Patterns](file:///Users/milumon/Documents/Github/everything-claude-code/skills/backend-patterns/SKILL.md)
- [Frontend Patterns](file:///Users/milumon/Documents/Github/everything-claude-code/skills/frontend-patterns/SKILL.md)
- [Postgres Patterns](file:///Users/milumon/Documents/Github/everything-claude-code/skills/postgres-patterns/SKILL.md)
- [Coding Standards](file:///Users/milumon/Documents/Github/everything-claude-code/skills/coding-standards/SKILL.md)
- [TDD Workflow](file:///Users/milumon/Documents/Github/everything-claude-code/skills/tdd-workflow/SKILL.md)
