"use client";

import Image from "next/image";
import { type Recipe, type PantryItem } from "@/types/dashboard.types";
import { CalorieRingChart } from "./CalorieRingChart";
import { MacroProgressBars } from "./MacroProgressBars";
import { useDictionary } from "@/contexts/DictionaryContext";

interface ProgressData {
    calories: { consumed: number; target: number };
    protein: { consumed: number; target: number };
    carbs: { consumed: number; target: number };
    fat: { consumed: number; target: number };
}

interface HomeTabProps {
    registrosCount: number;
    userGoal: string | null;
    recipes: Recipe[];
    pantryItems: PantryItem[];
    progress: ProgressData;
    onScanPhoto: () => void;
    onScanVoice: () => void;
    onScanText: () => void;
    onPantryScan: () => void;
    onViewHistory: () => void;
    onViewPantry: () => void;
    onRecipeClick: (recipe: Recipe) => void;
    onRefreshRecipes?: () => void;
    refreshCount?: number;
    canRefresh?: boolean;
    isRefreshing?: boolean;
}

// Stats card component for reusability
interface StatsCardProps {
    label: string;
    value: React.ReactNode;
    footer?: React.ReactNode;
    onClick?: () => void;
    clickable?: boolean;
}

function StatsCard({ label, value, footer, onClick, clickable = false }: StatsCardProps) {
    const baseClasses = "bg-gradient-to-br from-white to-slate-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/50 shadow-sm flex flex-col justify-between min-h-[100px] backdrop-blur-sm transition-all duration-200";
    const interactiveClasses = "cursor-pointer hover:shadow-lg hover:border-emerald-200/50 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97]";

    const content = (
        <>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{label}</p>
            {value}
            {footer && <div className="flex items-center gap-1">{footer}</div>}
        </>
    );

    // Use button when clickable for proper a11y
    if (clickable && onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`${baseClasses} ${interactiveClasses} w-full text-left`}
            >
                {content}
            </button>
        );
    }

    return (
        <div className={baseClasses}>
            {content}
        </div>
    );
}

// Coach AI card component
function CoachCard({ onScanPhoto, onScanVoice, onScanText, t }: {
    onScanPhoto: () => void;
    onScanVoice: () => void;
    onScanText: () => void;
    t: { coachTitle: string; coachQuestion: string; photo: string; voice: string; text: string };
}) {
    return (
        <div className="col-span-2 md:col-span-1 bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl text-white flex flex-col justify-between min-h-[140px] sm:min-h-[180px]">
            <div className="space-y-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-emerald-400 tracking-widest uppercase">
                    {t.coachTitle}
                </p>
                <h3 className="text-base sm:text-lg font-bold leading-tight">
                    &quot;{t.coachQuestion}&quot;
                </h3>
            </div>
            <div className="flex gap-2 pt-3">
                <button
                    type="button"
                    onClick={onScanPhoto}
                    className="flex-1 py-2.5 bg-emerald-500 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-200 hover:bg-emerald-400 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none active:scale-95"
                >
                    📷 {t.photo}
                </button>
                <button
                    type="button"
                    onClick={onScanVoice}
                    className="flex-1 py-2.5 bg-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none active:scale-95"
                >
                    🎙️ {t.voice}
                </button>
                <button
                    type="button"
                    onClick={onScanText}
                    className="flex-1 py-2.5 bg-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none active:scale-95"
                >
                    ✏️ {t.text}
                </button>
            </div>
        </div>
    );
}

// Progress section with charts
function ProgressSection({ progress, title }: { progress: ProgressData; title: string }) {
    return (
        <div className="bg-gradient-to-br from-white to-slate-50/30 p-5 rounded-3xl border border-white/50 shadow-sm backdrop-blur-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                📊 {title}
            </h3>
            <div className="grid grid-cols-2 gap-4 items-center">
                {/* Calorie Ring */}
                <div className="flex justify-center">
                    <CalorieRingChart
                        consumed={progress.calories.consumed}
                        target={progress.calories.target}
                        size={110}
                    />
                </div>

                {/* Macro Bars */}
                <MacroProgressBars
                    protein={progress.protein}
                    carbs={progress.carbs}
                    fat={progress.fat}
                />
            </div>
        </div>
    );
}

// Alacena (Pantry) section component
function AlacenaSection({
    pantryItems,
    onPantryScan,
    onViewPantry,
    t
}: {
    pantryItems: PantryItem[];
    onPantryScan: () => void;
    onViewPantry: () => void;
    t: any;
}) {
    const displayedItems = pantryItems.slice(0, 3);
    const hasMore = pantryItems.length > 3;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    📦 {t.pantryTitle}
                </h3>
                <button
                    onClick={onPantryScan}
                    className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors uppercase tracking-widest"
                >
                    {pantryItems.length > 0 ? t.pantryUpdate : t.pantryScan}
                </button>
            </div>

            {/* Pantry ingredients chips */}
            {pantryItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {displayedItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2 animate-fadeIn"
                        >
                            <span className="text-xs font-bold text-slate-700">{item.ingredientName}</span>
                            {item.quantity && (
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-lg truncate max-w-[60px]">
                                    {item.quantity} {item.unit}
                                </span>
                            )}
                        </div>
                    ))}
                    {hasMore && (
                        <button
                            onClick={onViewPantry}
                            className="bg-slate-50 px-3 py-1.5 rounded-xl border border-dashed border-slate-200 text-[10px] font-black text-slate-400 hover:bg-slate-100 transition-colors uppercase tracking-widest"
                        >
                            +{pantryItems.length - 6} {t.pantryViewAll}
                        </button>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={onPantryScan}
                    className="w-full bg-slate-50/50 border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center cursor-pointer hover:bg-slate-100 hover:border-emerald-300 transition-all"
                >
                    <p className="text-xs text-slate-400 font-medium">{t.pantryEmpty}</p>
                </button>
            )}

            {/* CTA to go to Almacén when has items */}
            {pantryItems.length > 0 && (
                <button
                    type="button"
                    onClick={onViewPantry}
                    className="w-full mt-3 py-2.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <span>👨‍🍳</span>
                    <span>Ir a Almacén</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}
        </div>
    );
}

export function HomeTab({
    registrosCount,
    userGoal,
    recipes,
    pantryItems,
    progress,
    onScanPhoto,
    onScanVoice,
    onScanText,
    onPantryScan,
    onViewHistory,
    onViewPantry,
    onRecipeClick,
    onRefreshRecipes,
    refreshCount,
    canRefresh,
    isRefreshing,
}: HomeTabProps) {
    const { dictionary } = useDictionary();
    const t = dictionary.dashboard.home;
    const goalTranslations = dictionary.dashboard.goals;

    // Translate goal from database value to localized string
    // Database might have Spanish values, keys, or other variations
    const translateGoal = (goal: string | null): string => {
        if (!goal) return t.noGoal;

        // Map common database values to translation keys
        const goalKeyMap: Record<string, keyof typeof goalTranslations> = {
            // Spanish values
            "perder peso": "lose_weight",
            "ganar músculo": "gain_muscle",
            "mantener peso": "maintain",
            "comer saludable": "eat_healthy",
            // English values
            "lose weight": "lose_weight",
            "build muscle": "gain_muscle",
            "gain muscle": "gain_muscle",
            "maintain weight": "maintain",
            "maintain": "maintain",
            "eat healthy": "eat_healthy",
            // Key values
            "lose_weight": "lose_weight",
            "gain_muscle": "gain_muscle",
            "eat_healthy": "eat_healthy",
        };

        const normalizedGoal = goal.toLowerCase().trim();
        const key = goalKeyMap[normalizedGoal];

        if (key && goalTranslations[key]) {
            return goalTranslations[key];
        }

        // Return original if no translation found
        return goal;
    };

    return (
        <div className="space-y-4 pb-10">
            {/* Main cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {/* Coach Card */}
                <div className="col-span-2 md:col-span-1 animate-fadeInUp stagger-1">
                    <CoachCard
                        onScanPhoto={onScanPhoto}
                        onScanVoice={onScanVoice}
                        onScanText={onScanText}
                        t={{
                            coachTitle: t.coachTitle,
                            coachQuestion: t.coachQuestion,
                            photo: t.photo,
                            voice: t.voice,
                            text: t.text,
                        }}
                    />
                </div>

                {/* Registros Card */}
                <div className="animate-fadeInUp stagger-2">
                    <StatsCard
                        label={t.registrosLabel}
                        value={<p className="text-3xl sm:text-4xl font-black text-slate-800 font-stats">{registrosCount}</p>}
                        footer={
                            <>
                                <p className="text-[9px] text-emerald-500 font-bold uppercase">{t.synced}</p>
                                {registrosCount > 0 && (
                                    <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </>
                        }
                        onClick={registrosCount > 0 ? onViewHistory : undefined}
                        clickable={registrosCount > 0}
                    />
                </div>

                {/* Meta Card */}
                <div className="animate-fadeInUp stagger-3">
                    <StatsCard
                        label={t.goalLabel}
                        value={
                            <p className="text-sm sm:text-base font-black text-slate-800 leading-tight line-clamp-2">
                                {translateGoal(userGoal)}
                            </p>
                        }
                    />
                </div>
            </div>

            {/* Progress Section with Charts */}
            <div className="animate-fadeInUp stagger-4">
                <ProgressSection progress={progress} title={t.todayProgress} />
            </div>

            {/* Alacena Section */}
            <div className="animate-fadeInUp stagger-5">
                <AlacenaSection
                    pantryItems={pantryItems}
                    onPantryScan={onPantryScan}
                    onViewPantry={onViewPantry}
                    t={t}
                />
            </div>
        </div>
    );
}
