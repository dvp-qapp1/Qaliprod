"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import type { DailyCalories } from "@/types/api.types";

interface CaloriesChartProps {
    data: DailyCalories[];
    targetCalories?: number;
}

const COLORS = {
    safe: "#22c55e", // green
    warning: "#eab308", // yellow
    danger: "#ef4444", // red
    target: "#6366f1", // indigo
};

function getBarColor(calories: number, target: number): string {
    const percentage = (calories / target) * 100;
    if (percentage <= 100) return COLORS.safe;
    if (percentage <= 120) return COLORS.warning;
    return COLORS.danger;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
}

export function CaloriesChart({
    data,
    targetCalories = 2000,
}: CaloriesChartProps) {
    const chartData = data
        .slice()
        .reverse()
        .map((d) => ({
            ...d,
            date: formatDate(d.date),
            total_calories: Number(d.total_calories),
        }));

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <p className="text-zinc-500">No hay datos de calorías esta semana</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold text-white mb-4">
                Calorías Semanales
            </h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: "#a1a1aa", fontSize: 12 }}
                        axisLine={{ stroke: "#3f3f46" }}
                    />
                    <YAxis
                        tick={{ fill: "#a1a1aa", fontSize: 12 }}
                        axisLine={{ stroke: "#3f3f46" }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #3f3f46",
                            borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                        itemStyle={{ color: "#a1a1aa" }}
                        formatter={(value) => [`${value ?? 0} kcal`, "Calorías"]}
                    />
                    <Bar dataKey="total_calories" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={getBarColor(entry.total_calories, targetCalories)}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-zinc-400">Bajo objetivo</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-zinc-400">Sobre 20%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-zinc-400">{">"} 20%</span>
                </div>
            </div>
        </div>
    );
}
