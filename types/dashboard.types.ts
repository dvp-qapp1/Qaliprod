// Dashboard tab types
export type TabType = "home" | "history" | "scanner" | "coach" | "profile" | "alacena";

// Navigation item for sidebar/bottom nav
export interface NavItem {
    id: TabType;
    label: string;
    icon: "home" | "history" | "camera" | "chat" | "user";
}

// Navigation configuration
export const NAV_ITEMS: NavItem[] = [
    { id: "home", label: "Inicio", icon: "home" },
    { id: "history", label: "Historial", icon: "history" },
    { id: "scanner", label: "Escanear", icon: "camera" },
    { id: "coach", label: "Coach", icon: "chat" },
    { id: "profile", label: "Perfil", icon: "user" },
];

// Chat message for Kili coach
export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
}

// CoachTab mode: general nutrition coaching vs recipe-focused cooking assistance
export type CoachMode = "coach" | "chef";

// Meal history item
export interface MealHistoryItem {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealTime: "Desayuno" | "Almuerzo" | "Cena" | "Bocadillo" | null;
    safetyStatus: "safe" | "warning" | "danger";
    ingredients: string[];
    detailedIngredients?: Array<{ name: string; calories: number; safe: boolean; warning?: string | null }>;
    imageUrl?: string;
    coachFeedback?: string;
    createdAt: Date;
}

// Recipe for inspiration grid
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

export type PantryCategory = 'abarrotes' | 'congelados' | 'refrigerados' | 'frutas_verduras' | 'snacks_dulces' | 'bebidas' | 'especias_condimentos' | 'panaderia_reposteria' | 'otros';

// Pantry item for Alacena
export interface PantryItem {
    id: string;
    ingredientName: string;
    nickname?: string;
    quantity?: number;
    unit?: string;
    category?: PantryCategory;
    lastUpdated: Date;
}

// Profile data for ProfileTab
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    age?: number;
    gender?: "hombre" | "mujer" | "otro";
    height?: number;
    heightFeet?: number;
    heightInches?: number;
    heightUnit: "cm" | "ft";
    weight?: number;
    weightUnit: "kg" | "lb";
    goal?: string;
    activityLevel?: string;
    allergies: string[];
    dietStyle: string[];
    bmi?: number;
    bmiCategory?: string;
    targetCalories?: number;
    languagePreference?: "es" | "en";
    themePreference?: "light" | "dark";
}

// Meal time colors mapping
export const MEAL_TIME_COLORS: Record<string, string> = {
    Desayuno: "bg-amber-50 text-amber-600 border-amber-100",
    Almuerzo: "bg-orange-50 text-orange-600 border-orange-100",
    Cena: "bg-indigo-50 text-indigo-600 border-indigo-100",
    Bocadillo: "bg-pink-50 text-pink-600 border-pink-100",
};

// Meal time emojis
export const MEAL_TIME_EMOJIS: Record<string, string> = {
    Desayuno: "🍳",
    Almuerzo: "🍱",
    Cena: "🥗",
    Bocadillo: "🍎",
};

// Generated recipe type
export interface GeneratedRecipe {
    id: string;
    title: string;
    ingredients: string[];
    instructions?: string[];
    calories: number;
    image_url?: string;
    description?: string;
    source_ingredients?: string[];
    created_at: string;
}
