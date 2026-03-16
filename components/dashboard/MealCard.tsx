"use client";

import { memo } from "react";
import type { Meal } from "@/types/api.types";

interface MealCardProps {
    meal: Meal;
    onDelete?: (id: string) => void;
}

function getSafetyBadge(status?: string) {
    switch (status) {
        case "safe":
            return (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    Saludable
                </span>
            );
        case "warning":
            return (
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    Moderado
                </span>
            );
        case "danger":
            return (
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    Alto
                </span>
            );
        default:
            return null;
    }
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// Memoized to prevent re-renders in lists (rerender-memo)
export const MealCard = memo(function MealCard({ meal, onDelete }: MealCardProps) {
    return (
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white truncate">{meal.name}</h4>
                        {getSafetyBadge(meal.safety_status)}
                    </div>
                    <p className="text-sm text-zinc-500">{formatTime(meal.meal_time)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold text-white">{meal.calories}</p>
                    <p className="text-xs text-zinc-500">kcal</p>
                </div>
            </div>

            {/* Macros row */}
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-zinc-400">{meal.protein}g P</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-zinc-400">{meal.carbs}g C</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-zinc-400">{meal.fat}g F</span>
                </div>

                {onDelete && (
                    <button
                        onClick={() => onDelete(meal.id)}
                        className="ml-auto text-zinc-500 hover:text-red-500 transition-colors"
                        aria-label="Eliminar comida"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Ingredients */}
            {meal.ingredients && meal.ingredients.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 truncate">
                        {meal.ingredients.slice(0, 3).join(", ")}
                        {meal.ingredients.length > 3 && ` +${meal.ingredients.length - 3} más`}
                    </p>
                </div>
            )}
        </div>
    );
});

