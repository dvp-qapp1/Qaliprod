"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import nextDynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useDictionary, useLocale } from "@/contexts/DictionaryContext";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HomeTab } from "@/components/dashboard/HomeTab";
import { HistoryTab } from "@/components/dashboard/HistoryTab";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { AddMealModal } from "@/components/dashboard/AddMealModal";
import { MealDetailModal } from "@/components/dashboard/MealDetailModal";
import { ProfileEditModal } from "@/components/dashboard/ProfileEditModal";
import { AlacenaTab } from "@/components/dashboard/AlacenaTab";

// Dynamic imports for heavy components (bundle-dynamic-imports)
// ScannerTab: 809 lines with camera/speech APIs - only load when needed
const ScannerTab = nextDynamic(
    () => import("@/components/dashboard/ScannerTab").then(m => m.ScannerTab),
    {
        loading: () => <DynamicTabLoader />,
        ssr: false, // Uses browser APIs (camera, speech)
    }
);

const CoachTab = nextDynamic(
    () => import("@/components/dashboard/CoachTab").then(m => m.CoachTab),
    {
        loading: () => <DynamicTabLoader />,
        ssr: false, // Uses client-side APIs
    }
);

/** Loading component for dynamic tabs */
function DynamicTabLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
    );
}



import { useMeals } from "@/hooks/useMeals";
import { useProfile } from "@/hooks/useProfile";
import {
    type TabType,
    type Recipe,
    type MealHistoryItem,
    type ChatMessage,
    type PantryItem,
    type CoachMode,
    type GeneratedRecipe,
} from "@/types/dashboard.types";

// Sample recipes for inspiration
const SAMPLE_RECIPES: Recipe[] = [
    {
        id: "1",
        title: "Ensalada Mediterránea",
        calories: 320,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400",
        ingredients: ["Tomates", "Pepinos", "Aceitunas", "Queso Feta"],
        instructions: ["Corta los vegetales", "Mezcla con aceite de oliva", "Añade el queso"],
    }
];

export function DashboardPage() {
    const router = useRouter();
    const supabase = createClient();
    const { dictionary: dict } = useDictionary();
    const locale = useLocale();
    const { todaySummary, isLoading: mealsLoading, error: mealsError, refetch } = useMeals();
    const { profile, isLoading: profileLoading, refetch: refetchProfile, updateProfile } = useProfile();

    const [activeTab, setActiveTab] = useState<TabType>("home");
    const [scannerMode, setScannerMode] = useState<"meal" | "pantry">("meal");
    const [initialScannerTab, setInitialScannerTab] = useState<"camera" | "voice" | "text">("camera");
    const [shouldShowScannerIntro, setShouldShowScannerIntro] = useState(true);
    const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState<MealHistoryItem | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isWaitingKili, setIsWaitingKili] = useState(false);
    const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
    const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
    const [pantryRecipes, setPantryRecipes] = useState<Recipe[]>([]);
    const [generatedRecipesHistory, setGeneratedRecipesHistory] = useState<GeneratedRecipe[]>([]);
    const [coachMode, setCoachMode] = useState<CoachMode>("coach");
    const [historyInitialTab, setHistoryInitialTab] = useState<"meals" | "recipes">("meals");
    const [chefRecipe, setChefRecipe] = useState<Recipe | null>(null);
    const [recipeRefreshCount, setRecipeRefreshCount] = useState(0);
    const [canRefreshRecipe, setCanRefreshRecipe] = useState(true);
    const [isRefreshingRecipes, setIsRefreshingRecipes] = useState(false);

    // Convert meals to history format - memoized to avoid recalculation (rerender-derived-state)
    const mealHistory = useMemo<MealHistoryItem[]>(() =>
        (todaySummary?.meals || []).map((meal) => ({
            id: meal.id,
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            mealTime: null,
            safetyStatus: meal.safety_status || "safe",
            ingredients: meal.ingredients || [],
            detailedIngredients: meal.detailed_ingredients,
            coachFeedback: meal.coach_feedback,
            createdAt: new Date(meal.meal_time),
        })),
        [todaySummary?.meals]
    );

    // Fetch Recipe suggestions based on Alacena (with persistence)
    const fetchPantrySuggestions = useCallback(async (forceRefresh = false) => {
        if (forceRefresh) {
            setIsRefreshingRecipes(true);
        }
        try {
            const url = `/api/meals/pantry/suggest?locale=${locale}${forceRefresh ? "&refresh=true" : ""}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.success && data.data) {
                setPantryRecipes(data.data);
            }
            if (data.meta) {
                setRecipeRefreshCount(data.meta.refresh_count);
                setCanRefreshRecipe(data.meta.can_refresh);
            }
        } catch (error: any) {
            console.error("Error fetching pantry suggestions:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                error
            });
        } finally {
            setIsRefreshingRecipes(false);
        }
    }, [locale]);

    // Fetch Pantry items from Supabase
    const fetchPantry = useCallback(async () => {
        if (!profile?.id) return;

        try {
            const { data, error } = await supabase
                .from("pantry_items")
                .select(`
                    id,
                    quantity,
                    unit,
                    nickname,
                    last_updated,
                    ingredients (
                        name,
                        category
                    )
                `)
                .eq("user_id", profile.id)
                .order("last_updated", { ascending: false });

            if (error) throw error;

            if (data) {
                const formatted: PantryItem[] = data.map((item: any) => ({
                    id: item.id,
                    ingredientName: item.ingredients?.name || "Ingrediente",
                    nickname: item.nickname,
                    quantity: item.quantity,
                    unit: item.unit,
                    category: item.ingredients?.category,
                    lastUpdated: new Date(item.last_updated),
                }));
                setPantryItems(formatted);

                if (formatted.length > 0) {
                    fetchPantrySuggestions();
                }
            }
        } catch (error: any) {
            console.error("Error fetching pantry:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                error
            });
        }
    }, [profile?.id, supabase, fetchPantrySuggestions]);

    // Fetch generated recipes history
    const fetchRecipesHistory = useCallback(async () => {
        if (!profile?.id) return;

        try {
            const { data, error } = await supabase
                .from("generated_recipes")
                .select("*")
                .eq("user_id", profile.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setGeneratedRecipesHistory(data || []);
        } catch (error: any) {
            console.error("Error fetching recipes history:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                error
            });
        }
    }, [profile?.id, supabase]);

    const handleDeletePantryItem = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/meals/pantry/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete");
            fetchPantry();
        } catch (error) {
            console.error("Error deleting pantry item:", error);
        }
    }, [fetchPantry]);

    const handleUpdatePantryItem = useCallback(async (id: string, updates: { quantity: number | null; unit: string | null }) => {
        try {
            const response = await fetch(`/api/meals/pantry/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (!response.ok) throw new Error("Failed to update");
            fetchPantry();
        } catch (error) {
            console.error("Error updating pantry item:", error);
        }
    }, [fetchPantry]);

    // Initial fetch
    useMemo(() => {
        if (profile?.id) {
            fetchPantry();
            fetchRecipesHistory();
        }
    }, [profile?.id, fetchPantry, fetchRecipesHistory]);

    // Auto-load chef recipe when pantry recipes are fetched
    useEffect(() => {
        if (pantryRecipes.length > 0 && !chefRecipe) {
            setChefRecipe(pantryRecipes[0]);
        }
    }, [pantryRecipes, chefRecipe]);

    // Calculate progress for charts using useMemo (rerender-derived-state)
    // Only recalculate when profile or todaySummary changes
    const progress = useMemo(() => {
        // Calculate target calories using Mifflin-St Jeor formula
        const calculateDefaultCalories = () => {
            if (!profile?.weight || !profile?.height || !profile?.age) return 2000;

            // Base BMR (Mifflin-St Jeor)
            const s = profile.gender === "mujer" ? -161 : 5;
            const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + s;

            // Activity multiplier
            const multipliers: Record<string, number> = {
                Sedentario: 1.2,
                "Ligeramente Activo": 1.375,
                Moderado: 1.55,
                "Muy Activo": 1.725,
            };
            const multiplier = multipliers[profile.activityLevel || "Moderado"] || 1.55;

            return Math.round(bmr * multiplier);
        };

        // Prefer stored value, fallback to calculated
        const targetCalories = profile?.targetCalories || calculateDefaultCalories();

        // Estimate macro targets based on calories (25% protein, 45% carbs, 30% fat)
        const targetProtein = Math.round((targetCalories * 0.25) / 4); // 4 cal/g
        const targetCarbs = Math.round((targetCalories * 0.45) / 4);   // 4 cal/g
        const targetFat = Math.round((targetCalories * 0.30) / 9);     // 9 cal/g

        return {
            calories: { consumed: todaySummary?.totals.calories || 0, target: targetCalories },
            protein: { consumed: todaySummary?.totals.protein || 0, target: targetProtein },
            carbs: { consumed: todaySummary?.totals.carbs || 0, target: targetCarbs },
            fat: { consumed: todaySummary?.totals.fat || 0, target: targetFat },
        };
    }, [profile, todaySummary]);

    // Tab change handler
    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
        // Reset sub-tab to meals when navigating normally to history
        if (tab === "history") {
            setHistoryInitialTab("meals");
        }
        // Reset scanner mode to meal when switching tabs normally
        if (tab !== "scanner") {
            setScannerMode("meal");
            setInitialScannerTab("camera");
        } else {
            setShouldShowScannerIntro(true);
        }
    }, []);

    // Meal added callback - now unused but kept for potential future use
    const handleMealAdded = useCallback(() => {
        refetch();
        setIsAddMealModalOpen(false);
        setActiveTab("history");
    }, [refetch]);

    // Recipe click handler - opens chef mode in coach tab
    const handleRecipeClick = useCallback((recipe: Recipe) => {
        setChefRecipe(recipe);
        setCoachMode("chef");
        setActiveTab("coach");
    }, []);

    // Generated recipe click handler for History Tab
    const handleGeneratedRecipeClick = useCallback((genRecipe: GeneratedRecipe) => {
        const recipe: Recipe = {
            id: genRecipe.id,
            title: genRecipe.title,
            calories: genRecipe.calories,
            image: genRecipe.image_url || "",
            ingredients: genRecipe.ingredients,
            instructions: genRecipe.instructions || [],
            description: genRecipe.description,
        };
        handleRecipeClick(recipe);
    }, [handleRecipeClick]);

    const handleRefreshRecipes = useCallback(() => {
        if (canRefreshRecipe) {
            fetchPantrySuggestions(true); // Force refresh with API
        }
    }, [fetchPantrySuggestions, canRefreshRecipe]);

    // Meal click handler - now opens detail modal
    const handleMealClick = useCallback((meal: MealHistoryItem) => {
        setSelectedMeal(meal);
    }, []);

    // Chat handler - now connects to real API with optional recipe context
    const handleSendMessage = useCallback(async (message: string, recipeContext?: Recipe) => {
        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: message,
            createdAt: new Date(),
        };
        setChatMessages((prev) => [...prev, userMessage]);
        setIsWaitingKili(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    history: chatMessages.map((m) => ({ role: m.role, content: m.content })),
                    // Send user's timezone offset (minutes from UTC, e.g., -300 for UTC-5)
                    timezoneOffset: new Date().getTimezoneOffset(),
                    // Send locale for bilingual AI responses
                    locale,
                    // Send recipe context for chef mode
                    recipe: recipeContext || undefined,
                }),
            });

            const data = await response.json();

            if (data.success && data.message) {
                const aiResponse: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: data.message,
                    createdAt: new Date(),
                };
                setChatMessages((prev) => [...prev, aiResponse]);
            } else {
                // Handle error
                const errorMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: "Lo siento, hubo un error al procesar tu mensaje. ¿Puedes intentarlo de nuevo? 🙏",
                    createdAt: new Date(),
                };
                setChatMessages((prev) => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Parece que hay un problema de conexión. Intenta de nuevo en unos segundos. 📡",
                createdAt: new Date(),
            };
            setChatMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsWaitingKili(false);
        }
    }, [chatMessages, locale]);

    // Profile handlers
    const handleEditProfile = useCallback(() => {
        setIsProfileEditOpen(true);
    }, []);

    const handleSaveProfile = useCallback(async (updates: Partial<typeof userProfile>) => {
        await updateProfile(updates);
    }, [updateProfile]);

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        router.push(`/${locale}/login`);
        router.refresh();
    }, [supabase.auth, router, locale]);

    // Loading state
    const isLoading = mealsLoading || profileLoading;

    if (isLoading) {
        return (
            <div
                role="status"
                aria-live="polite"
                className="min-h-screen bg-slate-50 flex items-center justify-center"
            >
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"
                        aria-hidden="true"
                    />
                    <p className="text-slate-400">{dict.dashboard.loading}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (mealsError) {
        return (
            <div
                role="alert"
                aria-live="assertive"
                className="min-h-screen bg-slate-50 flex items-center justify-center"
            >
                <div className="text-center">
                    <p className="text-rose-500 mb-2">{dict.dashboard.errorLoading}</p>
                    <p className="text-slate-500 text-sm">{mealsError}</p>
                </div>
            </div>
        );
    }

    // Default profile if not loaded
    const userProfile = profile || {
        id: "",
        name: "Usuario",
        email: "",
        heightUnit: "cm" as const,
        weightUnit: "kg" as const,
        allergies: [],
        dietStyle: [],
    };

    // Render active tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case "home":
                return (
                    <HomeTab
                        registrosCount={mealHistory.length}
                        userGoal={userProfile.goal || null}
                        recipes={pantryRecipes.length > 0 ? pantryRecipes : SAMPLE_RECIPES}
                        pantryItems={pantryItems}
                        progress={progress}
                        onScanPhoto={() => {
                            setScannerMode("meal");
                            setInitialScannerTab("camera");
                            setShouldShowScannerIntro(false);
                            setActiveTab("scanner");
                        }}
                        onScanVoice={() => {
                            setScannerMode("meal");
                            setInitialScannerTab("voice");
                            setShouldShowScannerIntro(false);
                            setActiveTab("scanner");
                        }}
                        onScanText={() => {
                            setScannerMode("meal");
                            setInitialScannerTab("text");
                            setShouldShowScannerIntro(false);
                            setActiveTab("scanner");
                        }}
                        onPantryScan={() => {
                            setScannerMode("pantry");
                            setShouldShowScannerIntro(false);
                            setActiveTab("scanner");
                        }}
                        onViewHistory={() => setActiveTab("history")}
                        onViewPantry={() => setActiveTab("alacena")}
                        onRecipeClick={handleRecipeClick}
                        onRefreshRecipes={handleRefreshRecipes}
                        refreshCount={recipeRefreshCount}
                        canRefresh={canRefreshRecipe}
                        isRefreshing={isRefreshingRecipes}
                    />
                );

            case "history":
                return (
                    <HistoryTab
                        meals={mealHistory}
                        recipes={generatedRecipesHistory}
                        initialTab={historyInitialTab}
                        onMealClick={handleMealClick}
                        onRecipeClick={handleGeneratedRecipeClick}
                        onScanFirst={() => {
                            setScannerMode("meal");
                            setShouldShowScannerIntro(false);
                            setActiveTab("scanner");
                        }}
                        onGoToAlacena={() => setActiveTab("alacena")}
                    />
                );

            case "scanner":
                return (
                    <ScannerTab
                        initialMode={scannerMode}
                        initialTab={initialScannerTab}
                        showIntro={shouldShowScannerIntro}
                        onMealSaved={() => {
                            refetch();
                            setActiveTab("history");
                        }}
                        onPantryUpdated={() => {
                            fetchPantry();
                            setActiveTab("home");
                        }}
                    />
                );

            case "coach":
                return (
                    <CoachTab
                        messages={chatMessages}
                        isWaiting={isWaitingKili}
                        onSendMessage={handleSendMessage}
                        mode={coachMode}
                        chefRecipe={chefRecipe}
                        recipesHistory={generatedRecipesHistory}
                        onModeChange={setCoachMode}
                        onRecipeChange={setChefRecipe}
                    />
                );

            case "profile":
                return (
                    <ProfileTab
                        profile={userProfile}
                        onEditProfile={handleEditProfile}
                        onUpdateProfile={handleSaveProfile}
                        onLogout={handleLogout}
                    />
                );

            case "alacena":
                return (
                    <AlacenaTab
                        items={pantryItems}
                        onScanMore={() => {
                            setScannerMode("pantry");
                            setShouldShowScannerIntro(false);
                            setActiveTab("scanner");
                        }}
                        onItemClick={(item) => {
                            // Handled internally by AlacenaTab modern modals
                        }}
                        onDeleteItem={handleDeletePantryItem}
                        onUpdateItem={handleUpdatePantryItem}
                        onRecipeGenerated={() => {
                            // Fetch again to show latest
                            fetchRecipesHistory();
                            // Force History to open in Recipes tab
                            setHistoryInitialTab("recipes");
                            // Navigate to History
                            setActiveTab("history");
                        }}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <>
            <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange}>
                {renderTabContent()}
            </DashboardLayout>

            {/* Add Meal Modal - kept for potential manual adding */}
            <AddMealModal
                isOpen={isAddMealModalOpen}
                onClose={() => {
                    setIsAddMealModalOpen(false);
                }}
                onSuccess={handleMealAdded}
            />

            {/* Meal Detail Modal */}
            <MealDetailModal
                meal={selectedMeal}
                isOpen={selectedMeal !== null}
                onClose={() => setSelectedMeal(null)}
            />

            {/* Profile Edit Modal */}
            <ProfileEditModal
                profile={userProfile}
                isOpen={isProfileEditOpen}
                onClose={() => setIsProfileEditOpen(false)}
                onSave={handleSaveProfile}
            />
        </>
    );
}
