"use client";

import { useDictionary } from "@/contexts/DictionaryContext";

interface MacroProgressBarsProps {
    protein: { consumed: number; target: number };
    carbs: { consumed: number; target: number };
    fat: { consumed: number; target: number };
}

interface MacroBarProps {
    label: string;
    consumed: number;
    target: number;
    color: string;
    bgColor: string;
}

function MacroBar({ label, consumed, target, color, bgColor }: MacroBarProps) {
    const percentage = Math.min((consumed / target) * 100, 100);
    const isOver = consumed > target;

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    {label}
                </span>
                <span className={`text-[10px] font-bold ${isOver ? "text-rose-500" : "text-slate-600"}`}>
                    {consumed}g / {target}g
                </span>
            </div>
            <div className={`h-2 rounded-full ${bgColor} overflow-hidden`}>
                <div
                    className={`h-full rounded-full ${color} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export function MacroProgressBars({ protein, carbs, fat }: MacroProgressBarsProps) {
    const { dictionary } = useDictionary();
    const t = dictionary.dashboard.macros;

    return (
        <div className="space-y-3">
            <MacroBar
                label={t.protein}
                consumed={protein.consumed}
                target={protein.target}
                color="bg-blue-500"
                bgColor="bg-blue-100"
            />
            <MacroBar
                label={t.carbs}
                consumed={carbs.consumed}
                target={carbs.target}
                color="bg-amber-500"
                bgColor="bg-amber-100"
            />
            <MacroBar
                label={t.fat}
                consumed={fat.consumed}
                target={fat.target}
                color="bg-rose-400"
                bgColor="bg-rose-100"
            />
        </div>
    );
}
