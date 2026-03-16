"use client";

import { useMemo, memo, useState } from "react";
import { type MealHistoryItem, type GeneratedRecipe, MEAL_TIME_COLORS, MEAL_TIME_EMOJIS } from "@/types/dashboard.types";
import { useDictionary } from "@/contexts/DictionaryContext";

type HistoryTabType = "meals" | "recipes";

interface HistoryTabProps {
    meals: MealHistoryItem[];
    recipes?: GeneratedRecipe[];
    onMealClick: (meal: MealHistoryItem) => void;
    onScanFirst: () => void;
    onGoToAlacena?: () => void;
}

// Single meal card component - memoized for list performance (rerender-memo)
const MealCard = memo(function MealCard({ meal, onClick }: { meal: MealHistoryItem; onClick: () => void }) {
    const emoji = meal.mealTime ? MEAL_TIME_EMOJIS[meal.mealTime] || "🍽️" : "🍽️";
    const timeColor = meal.mealTime
        ? MEAL_TIME_COLORS[meal.mealTime]
        : "bg-slate-50 text-slate-500 border-slate-100";

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left bg-gradient-to-br from-white to-slate-50/50 p-4 rounded-[28px] border border-white/60 flex items-center gap-3 shadow-md shadow-slate-200/50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200/50 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97] backdrop-blur-sm"
        >
            <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 ${meal.safetyStatus === "safe" ? "bg-emerald-50" : "bg-rose-50"
                    }`}
            >
                {emoji}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 leading-tight text-sm truncate">
                    {meal.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    {meal.mealTime && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${timeColor}`}>
                            {meal.mealTime}
                        </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-bold">
                        {meal.calories} kcal
                    </span>
                </div>
            </div>
            <div
                className={`w-2 h-2 rounded-full shrink-0 ${meal.safetyStatus === "safe" ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                aria-hidden="true"
            />
        </button>
    );
});

// Recipe card component
const RecipeCard = memo(function RecipeCard({ recipe, onClick }: { recipe: GeneratedRecipe; onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className="bg-gradient-to-br from-white to-emerald-50/30 p-4 rounded-[28px] border border-emerald-100/50 shadow-md shadow-emerald-100/30 transition-all hover:shadow-lg hover:border-emerald-200 cursor-pointer active:scale-[0.98]"
        >
            <div className="flex gap-3">
                {recipe.image_url && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                        <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm leading-tight truncate">
                        {recipe.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {recipe.calories} kcal
                        </span>
                        <span className="text-[10px] text-slate-400">
                            {recipe.ingredients?.length || 0} ingredientes
                        </span>
                    </div>
                    {recipe.description && (
                        <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                            {recipe.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
});

// Date separator component
function DateHeader({ date }: { date: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                {date}
            </span>
            <div className="h-px flex-1 bg-slate-100" />
        </div>
    );
}

// Empty state component for meals
function EmptyState({ onScanFirst, t }: { onScanFirst: () => void; t: { noMeals: string; scanFirst: string } }) {
    return (
        <div className="text-center py-16 space-y-4">
            <span className="text-5xl" aria-hidden="true">📝</span>
            <p className="text-slate-400 font-medium">{t.noMeals}</p>
            <button
                type="button"
                onClick={onScanFirst}
                className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:bg-emerald-400 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
            >
                {t.scanFirst}
            </button>
        </div>
    );
}

// Empty state for recipes
function RecipesEmptyState({ onGoToAlacena }: { onGoToAlacena?: () => void }) {
    return (
        <div className="text-center py-16 space-y-4">
            <span className="text-5xl" aria-hidden="true">👨‍🍳</span>
            <p className="text-slate-600 font-bold">No hay recetas generadas</p>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Ve a tu Alacena, selecciona ingredientes y genera recetas personalizadas con IA
            </p>
            {onGoToAlacena && (
                <button
                    type="button"
                    onClick={onGoToAlacena}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-emerald-400 active:scale-95"
                >
                    Ir a Alacena
                </button>
            )}
        </div>
    );
}

// Tab button component
function TabButton({
    active,
    onClick,
    icon,
    label,
    count
}: {
    active: boolean;
    onClick: () => void;
    icon: string;
    label: string;
    count: number;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${active
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
                }`}
        >
            <span>{icon}</span>
            <span>{label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                }`}>
                {count}
            </span>
        </button>
    );
}

interface HistoryTabProps {
    meals: MealHistoryItem[];
    recipes?: GeneratedRecipe[];
    onMealClick: (meal: MealHistoryItem) => void;
    onRecipeClick?: (recipe: GeneratedRecipe) => void;
    onScanFirst: () => void;
    onGoToAlacena?: () => void;
    initialTab?: HistoryTabType;
}

export function HistoryTab({
    meals,
    recipes = [],
    onMealClick,
    onRecipeClick,
    onScanFirst,
    onGoToAlacena,
    initialTab = "meals"
}: HistoryTabProps) {
    const { dictionary, locale } = useDictionary();
    const t = dictionary.dashboard.history;
    const [activeTab, setActiveTab] = useState<HistoryTabType>(initialTab);

    // Group meals by date with localized formatting
    const groupMealsByDate = (meals: MealHistoryItem[]): Record<string, MealHistoryItem[]> => {
        return meals.reduce((groups, meal) => {
            const date = meal.createdAt
                ? new Date(meal.createdAt).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                })
                : t.today;

            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(meal);
            return groups;
        }, {} as Record<string, MealHistoryItem[]>);
    };

    // Memoize grouped meals to avoid re-computation
    const groupedMeals = useMemo(() => groupMealsByDate(meals), [meals, locale, t.today]);

    return (
        <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-32">
            {/* Tabs Navigation */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
                <TabButton
                    active={activeTab === "meals"}
                    onClick={() => setActiveTab("meals")}
                    icon="🍽️"
                    label="Comidas"
                    count={meals.length}
                />
                <TabButton
                    active={activeTab === "recipes"}
                    onClick={() => setActiveTab("recipes")}
                    icon="👨‍🍳"
                    label="Recetas"
                    count={recipes.length}
                />
            </div>

            {/* Meals Tab Content */}
            {activeTab === "meals" && (
                <>
                    {meals.length === 0 ? (
                        <EmptyState onScanFirst={onScanFirst} t={{ noMeals: t.noMeals, scanFirst: t.scanFirst }} />
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedMeals).map(([date, dateMeals]) => (
                                <div key={date} className="space-y-3">
                                    <DateHeader date={date} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {dateMeals.map((meal) => (
                                            <div key={meal.id} className="relative py-1">
                                                <MealCard
                                                    meal={meal}
                                                    onClick={() => onMealClick(meal)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Recipes Tab Content */}
            {activeTab === "recipes" && (
                recipes.length === 0 ? (
                    <RecipesEmptyState onGoToAlacena={onGoToAlacena} />
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {recipes.map((recipe) => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onClick={() => onRecipeClick?.(recipe)}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
