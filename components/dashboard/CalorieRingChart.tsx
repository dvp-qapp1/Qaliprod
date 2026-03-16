"use client";

import { useDictionary } from "@/contexts/DictionaryContext";

interface CalorieRingChartProps {
    consumed: number;
    target: number;
    size?: number;
}

export function CalorieRingChart({ consumed, target, size = 120 }: CalorieRingChartProps) {
    const { dictionary } = useDictionary();
    const t = dictionary.dashboard.chart;

    const percentage = Math.min((consumed / target) * 100, 100);
    const remaining = Math.max(0, target - consumed);
    const isOver = consumed > target;

    // SVG circle math
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Color based on progress
    const getColor = () => {
        if (isOver) return { stroke: "#f43f5e", text: "text-rose-500", bg: "text-rose-100" };
        if (percentage > 85) return { stroke: "#f59e0b", text: "text-amber-500", bg: "text-amber-100" };
        return { stroke: "#10b981", text: "text-emerald-500", bg: "text-emerald-100" };
    };

    const colors = getColor();

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background circle */}
                <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-700 ease-out"
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-black font-stats ${colors.text}`}>
                        {consumed}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-stats">
                        / {target} kcal
                    </span>
                </div>
            </div>

            {/* Remaining label */}
            <div className="mt-2 text-center">
                <p className={`text-xs font-bold ${isOver ? "text-rose-500" : "text-slate-600"}`}>
                    {isOver ? `+${consumed - target} ${t.extra}` : `${remaining} ${t.remaining}`}
                </p>
            </div>
        </div>
    );
}
