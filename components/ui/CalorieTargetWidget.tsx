"use client";

import { useMemo } from "react";
import { useDictionary } from "@/contexts/DictionaryContext";

interface CalorieTargetWidgetProps {
    value: number;
    onChange: (value: number) => void;
    recommendedCalories: number;
    gender?: "hombre" | "mujer" | "otro";
    goal?: string | null;
}

type WarningLevel = "safe" | "low" | "high";

interface WarningState {
    level: WarningLevel;
    message: string;
    color: string;
    bgColor: string;
    icon: string;
}

export function CalorieTargetWidget({
    value,
    onChange,
    recommendedCalories,
    gender = "otro",
    goal,
}: CalorieTargetWidgetProps) {
    const { dictionary } = useDictionary();
    const t = dictionary.calorieWidget;

    // Determine safe minimum based on gender (WHO guidelines)
    const safeMinimum = gender === "mujer" ? 1200 : 1500;

    // Calculate warning thresholds based on recommendation
    const warningState = useMemo((): WarningState => {
        // Below WHO minimum
        if (value < safeMinimum) {
            return {
                level: "low",
                message: t.warnings.low.replace("{min}", safeMinimum.toString()),
                color: "text-amber-600",
                bgColor: "bg-amber-50 border-amber-200",
                icon: "⚠️",
            };
        }

        // Very high surplus (> 150% of recommended)
        if (value > recommendedCalories * 1.5) {
            return {
                level: "high",
                message: t.warnings.high,
                color: "text-amber-600",
                bgColor: "bg-amber-50 border-amber-200",
                icon: "⚠️",
            };
        }

        // Safe zone (within ~20% of recommended)
        return {
            level: "safe",
            message: t.warnings.safe,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50 border-emerald-200",
            icon: "✅",
        };
    }, [value, recommendedCalories, safeMinimum, t.warnings]);

    // Goal-based suggestion text
    const goalText = useMemo(() => {
        switch (goal) {
            case "Perder peso":
            case "Lose weight":
                return t.goalLabels.lose;
            case "Ganar músculo":
            case "Build muscle":
            case "Gain muscle":
                return t.goalLabels.gain;
            case "Mantener peso":
            case "Maintain weight":
                return t.goalLabels.maintain;
            default:
                return t.goalLabels.default;
        }
    }, [goal, t.goalLabels]);

    const handleIncrement = () => onChange(value + 100);
    const handleDecrement = () => onChange(Math.max(500, value - 100)); // Absolute floor

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value) || 0;
        onChange(Math.max(500, Math.min(10000, newValue))); // Floor 500, cap 10000
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="text-center">
                <h3 className="text-lg font-black text-slate-800">{t.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                    {t.recommended}: <span className="font-bold text-emerald-600">{recommendedCalories} kcal</span>
                    <span className="text-slate-300 mx-1">•</span>
                    {goalText}
                </p>
            </div>

            {/* Stepper Input */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={handleDecrement}
                    className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 font-black text-xl active:scale-95 transition-transform hover:bg-slate-200"
                >
                    −
                </button>

                <div className="relative">
                    <input
                        type="number"
                        value={value}
                        onChange={handleInputChange}
                        className="w-32 text-center text-3xl font-black text-slate-800 bg-white border-2 border-slate-200 rounded-2xl py-3 focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold uppercase">
                        {t.unit}
                    </span>
                </div>

                <button
                    onClick={handleIncrement}
                    className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 font-black text-xl active:scale-95 transition-transform hover:bg-slate-200"
                >
                    +
                </button>
            </div>

            {/* Progress bar showing position relative to recommendation */}
            <div className="pt-4">
                <div className="relative h-2 bg-slate-100 rounded-full overflow-visible">
                    {/* Recommended marker */}
                    <div
                        className="absolute top-0 w-0.5 h-4 -mt-1 bg-emerald-500"
                        style={{ left: "50%" }}
                    />

                    {/* Current value marker */}
                    <div
                        className={`absolute top-0 w-3 h-3 -mt-0.5 rounded-full border-2 border-white shadow ${warningState.level === "safe" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                        style={{
                            left: `${Math.min(100, Math.max(0, (value / (recommendedCalories * 2)) * 100))}%`,
                            transform: "translateX(-50%)"
                        }}
                    />
                </div>

                {/* Scale labels */}
                <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                    <span>{safeMinimum}</span>
                    <span className="text-emerald-600 font-bold">{recommendedCalories}</span>
                    <span>{recommendedCalories * 2}</span>
                </div>
            </div>

            {/* Warning/Status Message */}
            <div className={`flex items-center gap-2 p-3 rounded-xl border ${warningState.bgColor}`}>
                <span className="text-lg">{warningState.icon}</span>
                <p className={`text-xs font-medium ${warningState.color}`}>
                    {warningState.message}
                </p>
            </div>
        </div>
    );
}
