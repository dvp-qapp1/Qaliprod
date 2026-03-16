import { ACTIVITY_MULTIPLIERS } from "@/lib/prompts/coaching";
import type { EnrichedProfileContext, TodayMealContext } from "@/types/meal.types";

/**
 * Calculate BMI from height and weight
 */
export function calculateBMI(heightCm: number | null, weightKg: number | null): number | null {
    if (!heightCm || !weightKg) return null;
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
}

/**
 * Get BMI category in Spanish
 */
export function getBMICategory(bmi: number | null): "bajo_peso" | "normal" | "sobrepeso" | "obesidad" | null {
    if (!bmi) return null;
    if (bmi < 18.5) return "bajo_peso";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "sobrepeso";
    return "obesidad";
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 */
export function calculateBMR(
    weightKg: number | null,
    heightCm: number | null,
    age: number | null,
    gender: string | null
): number | null {
    if (!weightKg || !heightCm || !age) return null;

    const isMale = gender?.toLowerCase() === "male" || gender?.toLowerCase() === "masculino";

    // Mifflin-St Jeor Equation
    const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + (isMale ? 5 : -161);
    return Math.round(bmr);
}

/**
 * Calculate daily calorie target based on BMR, activity, and goal
 */
export function calculateDailyCalorieTarget(
    weightKg: number | null,
    heightCm: number | null,
    age: number | null,
    gender: string | null,
    activityLevel: string | null,
    goal: string | null
): number {
    const bmr = calculateBMR(weightKg, heightCm, age, gender);
    if (!bmr) return 2000; // Default fallback

    // Get activity multiplier
    const multiplierKey = activityLevel?.toLowerCase() || "moderate";
    const multiplier = ACTIVITY_MULTIPLIERS[multiplierKey] || ACTIVITY_MULTIPLIERS.moderate;

    // Total Daily Energy Expenditure
    let tdee = bmr * multiplier;

    // Adjust for goal
    switch (goal?.toLowerCase()) {
        case "lose_weight":
        case "perder_peso":
            tdee -= 400; // Moderate deficit
            break;
        case "gain_muscle":
        case "ganar_musculo":
            tdee += 300; // Moderate surplus
            break;
        // maintain and eat_healthy: keep at TDEE
    }

    return Math.round(tdee);
}

/**
 * Calculate macro targets based on calories and goal
 */
export function calculateMacroTargets(
    dailyCalories: number,
    weightKg: number | null,
    goal: string | null
): { protein: number; carbs: number; fat: number } {
    const weight = weightKg || 70; // Default weight

    let proteinRatio: number;
    let carbRatio: number;
    let fatRatio: number;

    switch (goal?.toLowerCase()) {
        case "lose_weight":
        case "perder_peso":
            // High protein, moderate carbs, moderate fat
            proteinRatio = 0.30; // 30% protein
            carbRatio = 0.40;    // 40% carbs
            fatRatio = 0.30;     // 30% fat
            break;
        case "gain_muscle":
        case "ganar_musculo":
            // High protein, high carbs, moderate fat
            proteinRatio = 0.30; // 30% protein
            carbRatio = 0.45;    // 45% carbs
            fatRatio = 0.25;     // 25% fat
            break;
        case "eat_healthy":
        case "comer_sano":
            // Balanced
            proteinRatio = 0.25; // 25% protein
            carbRatio = 0.45;    // 45% carbs
            fatRatio = 0.30;     // 30% fat
            break;
        default: // maintain
            proteinRatio = 0.25;
            carbRatio = 0.50;
            fatRatio = 0.25;
    }

    return {
        protein: Math.round((dailyCalories * proteinRatio) / 4), // 4 cal/g
        carbs: Math.round((dailyCalories * carbRatio) / 4),      // 4 cal/g
        fat: Math.round((dailyCalories * fatRatio) / 9),         // 9 cal/g
    };
}

/**
 * Build enriched profile context from database profile
 */
export function buildEnrichedProfile(profile: {
    name?: string | null;
    age?: number | null;
    gender?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    goal?: string | null;
    activity_level?: string | null;
    diet_style?: string | null;
    allergies?: string[] | null;
    target_calories?: number | null;
}): EnrichedProfileContext {
    const bmi = calculateBMI(profile.height_cm ?? null, profile.weight_kg ?? null);
    const dailyCalorieTarget = profile.target_calories || calculateDailyCalorieTarget(
        profile.weight_kg ?? null,
        profile.height_cm ?? null,
        profile.age ?? null,
        profile.gender ?? null,
        profile.activity_level ?? null,
        profile.goal ?? null
    );
    const macros = calculateMacroTargets(dailyCalorieTarget, profile.weight_kg ?? null, profile.goal ?? null);

    return {
        name: profile.name || "Usuario",
        age: profile.age ?? null,
        gender: profile.gender ?? null,
        heightCm: profile.height_cm ?? null,
        weightKg: profile.weight_kg ?? null,
        bmi,
        bmiCategory: getBMICategory(bmi),
        goal: profile.goal ?? null,
        activityLevel: profile.activity_level ?? null,
        dietStyle: profile.diet_style ?? null,
        allergies: profile.allergies || [],
        dailyCalorieTarget,
        dailyProteinTarget: macros.protein,
        dailyCarbsTarget: macros.carbs,
        dailyFatTarget: macros.fat,
    };
}

/**
 * Build today's meal context from meal history
 */
export function buildTodayContext(meals: Array<{
    name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    meal_time?: string;
    created_at: string;
}>): TodayMealContext {
    return {
        caloriesConsumed: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
        proteinConsumed: meals.reduce((sum, m) => sum + (m.protein || 0), 0),
        carbsConsumed: meals.reduce((sum, m) => sum + (m.carbs || 0), 0),
        fatConsumed: meals.reduce((sum, m) => sum + (m.fat || 0), 0),
        mealsCount: meals.length,
        meals: meals.map(m => ({
            name: m.name,
            calories: m.calories,
            mealTime: m.meal_time || "Comida",
            createdAt: m.created_at,
        })),
    };
}
