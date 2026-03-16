// Unified types for meal analysis across the application

/**
 * Ingredient analysis with safety evaluation
 */
export interface IngredientAnalysis {
    name: string;
    calories: number;
    safe: boolean;
    warning: string | null;
}

/**
 * Complete meal analysis result from AI
 */
export interface MealAnalysisResult {
    isFood: boolean;
    name: string;
    calories: number;
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    ingredients: IngredientAnalysis[];
    safetyStatus: "safe" | "warning" | "danger";
    suggestions: string[];
}

/**
 * User goal types
 */
export type UserGoal =
    | "lose_weight"
    | "gain_muscle"
    | "maintain"
    | "eat_healthy";

/**
 * Meal time types
 */
export type MealTime =
    | "breakfast"
    | "lunch"
    | "dinner"
    | "snack";

/**
 * Enriched profile context for AI prompts
 */
export interface EnrichedProfileContext {
    // Basic profile
    name: string;
    age: number | null;
    gender: string | null;

    // Physical stats
    heightCm: number | null;
    weightKg: number | null;
    bmi: number | null;
    bmiCategory: "bajo_peso" | "normal" | "sobrepeso" | "obesidad" | null;

    // Goals & preferences
    goal: UserGoal | string | null;
    activityLevel: string | null;
    dietStyle: string | null;
    allergies: string[];

    // Calculated targets
    dailyCalorieTarget: number;
    dailyProteinTarget: number;
    dailyCarbsTarget: number;
    dailyFatTarget: number;
}

/**
 * Today's meal history for context
 */
export interface TodayMealContext {
    caloriesConsumed: number;
    proteinConsumed: number;
    carbsConsumed: number;
    fatConsumed: number;
    mealsCount: number;
    meals: Array<{
        name: string;
        calories: number;
        mealTime: string;
        createdAt: string;
    }>;
}

/**
 * Complete context for AI feedback generation
 */
export interface FeedbackContext {
    profile: EnrichedProfileContext;
    today: TodayMealContext;
    currentMeal: {
        name: string;
        calories: number;
        macros: { protein: number; carbs: number; fat: number };
        ingredients: IngredientAnalysis[];
        mealTime: MealTime;
    };
}
