"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface MacrosChartProps {
    protein: number;
    carbs: number;
    fat: number;
}

const COLORS = {
    protein: "#ef4444", // red
    carbs: "#3b82f6", // blue
    fat: "#eab308", // yellow
};

const LABELS = {
    protein: "Proteína",
    carbs: "Carbohidratos",
    fat: "Grasas",
};

export function MacrosChart({ protein, carbs, fat }: MacrosChartProps) {
    const total = protein + carbs + fat;

    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <p className="text-zinc-500">No hay datos de macros hoy</p>
            </div>
        );
    }

    const data = [
        { name: LABELS.protein, value: protein, color: COLORS.protein },
        { name: LABELS.carbs, value: carbs, color: COLORS.carbs },
        { name: LABELS.fat, value: fat, color: COLORS.fat },
    ];

    return (
        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold text-white mb-4">
                Macros de Hoy
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #3f3f46",
                            borderRadius: "8px",
                        }}
                        formatter={(value) => [`${value ?? 0}g`, ""]}
                    />
                    <Legend
                        formatter={(value) => (
                            <span className="text-zinc-300 text-sm">{value}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                    <p className="text-2xl font-bold text-red-500">{protein}g</p>
                    <p className="text-xs text-zinc-500">Proteína</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-blue-500">{carbs}g</p>
                    <p className="text-xs text-zinc-500">Carbos</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-yellow-500">{fat}g</p>
                    <p className="text-xs text-zinc-500">Grasas</p>
                </div>
            </div>
        </div>
    );
}
