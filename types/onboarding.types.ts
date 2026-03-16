// Onboarding related types
export type Allergy = string;
export type Goal =
    | "Perder peso"
    | "Ganar músculo"
    | "Mantener peso"
    | "Mejorar energía"
    | "Mejorar digestión";
export type DietStyle =
    | "Omnívoro"
    | "Vegetariano"
    | "Vegano"
    | "Pescetariano"
    | "Keto"
    | "Sin gluten"
    | "Sin lactosa";
export type ActivityLevel =
    | "Sedentario"
    | "Ligeramente Activo"
    | "Moderado"
    | "Muy Activo";
export type Gender = "hombre" | "mujer" | "otro";
export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "ft";

export interface OnboardingData {
    // Step 2: Allergies
    allergies: Allergy[];

    // Step 3: Goal
    goal: Goal | null;

    // Step 4: Diet Style
    dietStyle: DietStyle[];

    // Step 5: Personal Info
    age: number | "";
    gender: Gender;

    // Step 6 & 7: Body Measurements
    height: number | "";
    heightFeet: number | "";
    heightInches: number | "";
    heightUnit: HeightUnit;
    weight: number | "";
    weightUnit: WeightUnit;

    // Step 8: Activity
    activityLevel: ActivityLevel | null;

    // Step 9: Calorie Target
    targetCalories: number | null;

    // Calculated
    bmi: number | null;
    bmiCategory: string | null;
}

// Constants for onboarding options
export const ALLERGIES_OPTIONS: Allergy[] = [
    "Gluten",
    "Lácteos",
    "Nueces",
    "Maní",
    "Mariscos",
    "Soja",
    "Huevo",
    "Pescado",
];

export const GOAL_OPTIONS: Goal[] = [
    "Perder peso",
    "Ganar músculo",
    "Mantener peso",
    "Mejorar energía",
    "Mejorar digestión",
];

export const DIET_OPTIONS: DietStyle[] = [
    "Omnívoro",
    "Vegetariano",
    "Vegano",
    "Pescetariano",
    "Keto",
    "Sin gluten",
    "Sin lactosa",
];

export const ACTIVITY_LEVELS: ActivityLevel[] = [
    "Sedentario",
    "Ligeramente Activo",
    "Moderado",
    "Muy Activo",
];

export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
    Sedentario: "Trabajo de oficina, poco movimiento.",
    "Ligeramente Activo": "Caminatas cortas, poco ejercicio.",
    Moderado: "Ejercicio 3-4 veces por semana.",
    "Muy Activo": "Entrenamiento diario intenso.",
};

export const DIET_DESCRIPTIONS: Record<DietStyle, string> = {
    "Omnívoro": "omnivore",
    "Vegetariano": "vegetarian",
    "Vegano": "vegan",
    "Pescetariano": "pescetarian",
    "Keto": "keto",
    "Sin gluten": "glutenFree",
    "Sin lactosa": "lactoseFree",
};

// Initial state for onboarding
export const INITIAL_ONBOARDING_DATA: OnboardingData = {
    allergies: [],
    goal: null,
    dietStyle: [],
    age: "",
    gender: "otro",
    height: "",
    heightFeet: "",
    heightInches: "",
    heightUnit: "cm",
    weight: "",
    weightUnit: "kg",
    activityLevel: null,
    targetCalories: null,
    bmi: null,
    bmiCategory: null,
};
