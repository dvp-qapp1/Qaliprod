// API Response Types

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
}

// Subscription Tiers

export type SubscriptionTier = "free" | "premium" | "pro";

// Meal Types

// Portion size options for user selection
export type PortionSize = 'small' | 'medium' | 'large' | 'extra_large';

// Portion estimation from AI analysis
export interface PortionEstimate {
    totalGrams: number;
    confidence: 'high' | 'medium' | 'low';
    referenceUsed: string;
    breakdown: Array<{
        ingredient: string;
        grams: number;
        caloriesPer100g: number;
    }>;
}

// Detailed ingredient with safety info
export interface DetailedIngredient {
    name: string;
    grams?: number;
    calories: number;
    safe: boolean;
    warning?: string | null;
}

export interface Meal {
    id: string;
    user_id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image_url?: string;
    ingredients: string[];
    detailed_ingredients?: DetailedIngredient[];
    safety_status?: "safe" | "warning" | "danger";
    coach_feedback?: string;
    meal_time: string;
    created_at: string;
}

export interface Recipe {
    id: string;
    title: string;
    calories: number;
    image: string;
    ingredients: string[];
    instructions: string[];
    description?: string;
    image_description?: string;
}

export interface MealAnalysis {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string[];
    suggestions: string[];
}

export type PantryCategory = 'abarrotes' | 'congelados' | 'refrigerados' | 'frutas_verduras' | 'snacks_dulces' | 'bebidas' | 'especias_condimentos' | 'panaderia_reposteria' | 'otros';

export interface PantryAnalysis {
    isFood: boolean;
    ingredients: Array<{
        name: string;
        quantity?: number;
        unit?: string;
        category?: PantryCategory;
    }>;
}

export interface AnalyzedMeal extends Meal {
    suggestions: string[];
}

// Profile Types

export interface Profile {
    id: string;
    user_id: string;
    email: string;
    name: string;
    age?: number;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    height_cm?: number;
    weight_kg?: number;
    goal?: "lose_weight" | "gain_muscle" | "maintain" | "eat_healthy";
    activity_level?: "sedentary" | "light" | "moderate" | "active" | "very_active";
    target_calories?: number;
    allergies?: string[];
    diet_style?: string;
    subscription_tier: SubscriptionTier;
    language_preference?: "es" | "en";
    theme_preference?: "light" | "dark";
    deleted_at?: string;
    created_at: string;
    updated_at: string;
}

// Daily Calories

export interface DailyCalories {
    id: string;
    user_id: string;
    date: string;
    total_calories: number;
    protein: number;
    carbs: number;
    fat: number;
    meals_count: number;
    created_at: string;
    updated_at: string;
}

// Rate Limit Types

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}

// Circuit Breaker Types

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
}
