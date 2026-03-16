"use client";

interface TodaySummaryProps {
    calories: number;
    mealsCount: number;
    targetCalories?: number;
}

export function TodaySummary({
    calories,
    mealsCount,
    targetCalories = 2000,
}: TodaySummaryProps) {
    const percentage = Math.min(100, (calories / targetCalories) * 100);
    const remaining = Math.max(0, targetCalories - calories);
    const isOver = calories > targetCalories;

    return (
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl p-6 border border-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Resumen de Hoy</h3>
                <span className="text-sm text-zinc-400">
                    {mealsCount} {mealsCount === 1 ? "comida" : "comidas"}
                </span>
            </div>

            {/* Calories circle */}
            <div className="flex items-center justify-center py-4">
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        {/* Background circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="#27272a"
                            strokeWidth="12"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke={isOver ? "#ef4444" : "#6366f1"}
                            strokeWidth="12"
                            strokeDasharray={`${percentage * 3.27} 327`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white">{calories}</span>
                        <span className="text-sm text-zinc-400">kcal</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm mt-2">
                <div>
                    <p className="text-zinc-400">Objetivo</p>
                    <p className="text-white font-semibold">{targetCalories} kcal</p>
                </div>
                <div className="text-right">
                    <p className="text-zinc-400">{isOver ? "Exceso" : "Restante"}</p>
                    <p
                        className={`font-semibold ${isOver ? "text-red-500" : "text-green-500"}`}
                    >
                        {isOver ? `+${calories - targetCalories}` : remaining} kcal
                    </p>
                </div>
            </div>
        </div>
    );
}
