"use client";

import { type MealHistoryItem, MEAL_TIME_COLORS, MEAL_TIME_EMOJIS } from "@/types/dashboard.types";
import { AccessibleModal } from "@/components/ui/AccessibleModal";

// Type for detailed ingredient display
interface DetailedIngredient {
    name: string;
    calories: number;
    safe: boolean;
    warning?: string | null;
}

interface MealDetailModalProps {
    meal: MealHistoryItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export function MealDetailModal({ meal, isOpen, onClose }: MealDetailModalProps) {
    if (!meal) return null;

    const emoji = meal.mealTime ? MEAL_TIME_EMOJIS[meal.mealTime] || "🍽️" : "🍽️";
    const timeColor = meal.mealTime
        ? MEAL_TIME_COLORS[meal.mealTime]
        : "bg-slate-50 text-slate-500 border-slate-100";

    // Use detailed ingredients from database if available, otherwise fallback to basic estimation
    const detailedIngredients: DetailedIngredient[] = meal.detailedIngredients
        ? meal.detailedIngredients.map((ing) => ({
            name: ing.name,
            calories: ing.calories,
            safe: ing.safe,
            warning: ing.warning,
        }))
        : meal.ingredients.map((ing) => ({
            // Fallback for older meals without detailed ingredient data
            name: ing,
            calories: meal.ingredients.length > 0
                ? Math.round(meal.calories / meal.ingredients.length)
                : 0,
            safe: true, // Default to safe for legacy data
            warning: null,
        }));

    // Format date nicely
    const formattedDate = meal.createdAt.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
    });

    // Count unsafe ingredients
    const unsafeCount = detailedIngredients.filter(i => !i.safe).length;

    return (
        <AccessibleModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Detalles de ${meal.name}`}
        >
            <div className="p-6 md:p-10 space-y-6 overflow-y-auto no-scrollbar">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${meal.safetyStatus === "safe"
                            ? "bg-emerald-50 text-emerald-500"
                            : meal.safetyStatus === "warning"
                                ? "bg-amber-50 text-amber-500"
                                : "bg-rose-50 text-rose-500"
                            }`}
                        aria-hidden="true"
                    >
                        {emoji}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-800 leading-tight">
                            {meal.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            {meal.mealTime && (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${timeColor}`}>
                                    {meal.mealTime}
                                </span>
                            )}
                            <p className="text-[10px] text-slate-400 font-bold">{meal.calories} kcal</p>
                            <span className="text-slate-300" aria-hidden="true">•</span>
                            <p className="text-[10px] text-slate-400 font-bold">{formattedDate}</p>
                        </div>
                    </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Información nutricional">
                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                        <p className="text-lg font-black text-blue-600">{meal.protein}g</p>
                        <p className="text-[9px] font-bold text-blue-400 uppercase">Proteína</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-xl text-center">
                        <p className="text-lg font-black text-amber-600">{meal.carbs}g</p>
                        <p className="text-[9px] font-bold text-amber-400 uppercase">Carbos</p>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-xl text-center">
                        <p className="text-lg font-black text-rose-600">{meal.fat}g</p>
                        <p className="text-[9px] font-bold text-rose-400 uppercase">Grasas</p>
                    </div>
                </div>

                {/* Ingredients Detected */}
                {detailedIngredients.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Ingredientes Detectados ({detailedIngredients.length})
                            {unsafeCount > 0 && (
                                <span className="ml-2 text-rose-500">• {unsafeCount} alerta{unsafeCount > 1 ? "s" : ""}</span>
                            )}
                        </h4>
                        <ul className="space-y-2 max-h-48 overflow-y-auto no-scrollbar" role="list">
                            {detailedIngredients.map((ingredient, idx) => (
                                <li
                                    key={idx}
                                    className={`flex items-center justify-between p-3 rounded-2xl border ${ingredient.safe
                                        ? "bg-slate-50 border-slate-100"
                                        : "bg-rose-50 border-rose-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {/* Status dot */}
                                        <span
                                            className={`w-2 h-2 rounded-full ${ingredient.safe ? "bg-emerald-500" : "bg-rose-500"
                                                }`}
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <span
                                                className={`text-sm font-bold ${ingredient.safe ? "text-slate-700" : "text-rose-700"
                                                    }`}
                                            >
                                                {ingredient.name}
                                            </span>
                                            {/* Warning message for unsafe ingredients */}
                                            {!ingredient.safe && ingredient.warning && (
                                                <p className="text-[10px] text-rose-500 mt-0.5">
                                                    {ingredient.warning}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400">
                                        {ingredient.calories} kcal
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Coach feedback */}
                {meal.coachFeedback && (
                    <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg" aria-hidden="true">💡</span>
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                Consejo de Kili
                            </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {meal.coachFeedback}
                        </p>
                    </div>
                )}

                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-200 hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
                >
                    Cerrar
                </button>
            </div>
        </AccessibleModal>
    );
}

