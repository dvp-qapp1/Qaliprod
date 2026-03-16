"use client";

import { type Recipe } from "@/types/dashboard.types";
import { AccessibleModal } from "@/components/ui/AccessibleModal";
import { useState } from "react";

interface RecipeDetailModalProps {
    recipe: Recipe | null;
    isOpen: boolean;
    onClose: () => void;
}

export function RecipeDetailModal({ recipe, isOpen, onClose }: RecipeDetailModalProps) {
    const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

    if (!recipe) return null;

    const toggleIngredient = (ing: string) => {
        setCheckedIngredients(prev => ({
            ...prev,
            [ing]: !prev[ing]
        }));
    };

    return (
        <AccessibleModal
            isOpen={isOpen}
            onClose={onClose}
            title={recipe.title}
        >
            <div className="relative">
                {/* Hero Image */}
                <div className="relative h-64 sm:h-80 w-full">
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                            {recipe.title}
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                🔥 {recipe.calories} kcal
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                    {/* Description */}
                    {recipe.description && (
                        <p className="text-slate-600 text-sm leading-relaxed italic font-medium">
                            "{recipe.description}"
                        </p>
                    )}

                    {/* Ingredients Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span>🛒</span> Ingredientes
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {recipe.ingredients.map((ing, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => toggleIngredient(ing)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${checkedIngredients[ing]
                                            ? "bg-slate-50 border-slate-100 opacity-50"
                                            : "bg-white border-slate-100 hover:border-emerald-200"
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${checkedIngredients[ing]
                                            ? "bg-emerald-500 border-emerald-500"
                                            : "border-slate-200"
                                        }`}>
                                        {checkedIngredients[ing] && (
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`text-sm font-bold ${checkedIngredients[ing] ? "text-slate-400 line-through" : "text-slate-700"
                                        }`}>
                                        {ing}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Instructions Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span>👨‍🍳</span> Preparación
                        </h3>
                        <div className="space-y-6">
                            {recipe.instructions.map((step, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black text-xs">
                                        {idx + 1}
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed pt-1">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Vision Vision Section */}
                    {recipe.image_description && (
                        <div className="bg-slate-900 rounded-[32px] p-6 text-white space-y-3">
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                👁️ Visión de Kili
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed italic">
                                "{recipe.image_description.replace("IMPORTANT: Generate exactly one image", "").trim()}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-6 sm:p-8 bg-white border-t border-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-emerald-500 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                        ¡Entendido, a cocinar!
                    </button>
                </div>
            </div>
        </AccessibleModal>
    );
}
