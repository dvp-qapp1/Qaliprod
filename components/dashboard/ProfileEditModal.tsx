"use client";

import { useState, useEffect } from "react";
import { type UserProfile } from "@/types/dashboard.types";
import { UnitToggle } from "@/components/ui/UnitToggle";
import { AccessibleModal } from "@/components/ui/AccessibleModal";
import { useDictionary } from "@/contexts/DictionaryContext";
import {
    convertWeight,
    convertCmToFeetInches,
    convertHeightToCm,
} from "@/lib/utils/bmiCalculator";
import {
    GOAL_OPTIONS,
    ACTIVITY_LEVELS,
    DIET_OPTIONS,
    ALLERGIES_OPTIONS,
} from "@/types/onboarding.types";

interface ProfileEditModalProps {
    profile: UserProfile;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: Partial<UserProfile>) => Promise<void>;
}

// Reverse-map DB English values → UI Spanish values for display
const goalFromDB: Record<string, string> = {
    lose_weight: "Perder peso",
    gain_muscle: "Ganar músculo",
    maintain: "Mantener peso",
    eat_healthy: "Mejorar energía",
};
const activityFromDB: Record<string, string> = {
    sedentary: "Sedentario",
    light: "Ligeramente Activo",
    moderate: "Moderado",
    active: "Muy Activo",
    very_active: "Muy Activo",
};
const genderFromDB: Record<string, string> = {
    male: "hombre",
    female: "mujer",
    other: "otro",
};

const mapFromDB = (value: string | undefined, map: Record<string, string>) => {
    if (!value) return value;
    return map[value] || value;
};

export function ProfileEditModal({
    profile,
    isOpen,
    onClose,
    onSave,
}: ProfileEditModalProps) {
    const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const { dictionary } = useDictionary();
    const t = dictionary.dashboard.profile;
    const tc = dictionary.common;

    // Initialize form when modal opens (map DB values to UI values)
    useEffect(() => {
        if (isOpen) {
            setSaveError(null);
            setEditedProfile({
                age: profile.age,
                gender: mapFromDB(profile.gender, genderFromDB) as "hombre" | "mujer" | "otro" | undefined,
                height: profile.height,
                heightFeet: profile.heightFeet,
                heightInches: profile.heightInches,
                heightUnit: profile.heightUnit || "cm",
                weight: profile.weight,
                weightUnit: profile.weightUnit || "kg",
                goal: mapFromDB(profile.goal, goalFromDB),
                activityLevel: mapFromDB(profile.activityLevel, activityFromDB),
                allergies: [...(profile.allergies || [])],
                dietStyle: [...(profile.dietStyle || [])],
                targetCalories: profile.targetCalories,
            });
        }
    }, [isOpen, profile]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            await onSave(editedProfile);
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : t.saveError;
            setSaveError(message);
            console.error("Error saving profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleWeightUnitChange = (unit: string) => {
        const newUnit = unit as "kg" | "lb";
        if (newUnit === editedProfile.weightUnit) return;

        if (editedProfile.weight && typeof editedProfile.weight === "number") {
            const converted = convertWeight(
                editedProfile.weight,
                editedProfile.weightUnit || "kg",
                newUnit
            );
            setEditedProfile((prev) => ({
                ...prev,
                weightUnit: newUnit,
                weight: Math.round(converted),
            }));
        } else {
            setEditedProfile((prev) => ({ ...prev, weightUnit: newUnit }));
        }
    };

    const handleHeightUnitChange = (unit: string) => {
        const newUnit = unit as "cm" | "ft";
        if (newUnit === editedProfile.heightUnit) return;

        if (newUnit === "ft" && editedProfile.height && typeof editedProfile.height === "number") {
            const { feet, inches } = convertCmToFeetInches(editedProfile.height);
            setEditedProfile((prev) => ({
                ...prev,
                heightUnit: newUnit,
                heightFeet: feet,
                heightInches: inches,
            }));
        } else if (newUnit === "cm") {
            const feet = typeof editedProfile.heightFeet === "number" ? editedProfile.heightFeet : 0;
            const inches = typeof editedProfile.heightInches === "number" ? editedProfile.heightInches : 0;
            if (feet > 0 || inches > 0) {
                const cm = convertHeightToCm(feet, inches);
                setEditedProfile((prev) => ({ ...prev, heightUnit: newUnit, height: cm }));
            } else {
                setEditedProfile((prev) => ({ ...prev, heightUnit: newUnit }));
            }
        }
    };

    const toggleAllergy = (allergy: string) => {
        const allergies = editedProfile.allergies || [];
        if (allergies.includes(allergy)) {
            setEditedProfile((prev) => ({
                ...prev,
                allergies: allergies.filter((a) => a !== allergy),
            }));
        } else {
            setEditedProfile((prev) => ({
                ...prev,
                allergies: [...allergies, allergy],
            }));
        }
    };

    const toggleDiet = (diet: string) => {
        const dietStyle = editedProfile.dietStyle || [];
        if (dietStyle.includes(diet)) {
            setEditedProfile((prev) => ({
                ...prev,
                dietStyle: dietStyle.filter((d) => d !== diet),
            }));
        } else {
            setEditedProfile((prev) => ({
                ...prev,
                dietStyle: [...dietStyle, diet],
            }));
        }
    };

    return (
        <AccessibleModal
            isOpen={isOpen}
            onClose={onClose}
            title={t.editTitle}
        >
            <div className="p-8">
                <h3 className="text-xl font-black text-slate-800 text-center mb-6">{t.editTitle}</h3>

                {/* Error Alert */}
                {saveError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                        {saveError}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Age & Gender */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t.age}</label>
                            <input
                                type="number"
                                value={editedProfile.age || ""}
                                onChange={(e) =>
                                    setEditedProfile((prev) => ({
                                        ...prev,
                                        age: parseInt(e.target.value) || undefined,
                                    }))
                                }
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                                placeholder="25"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t.gender}</label>
                            <select
                                value={editedProfile.gender || ""}
                                onChange={(e) =>
                                    setEditedProfile((prev) => ({
                                        ...prev,
                                        gender: e.target.value as "hombre" | "mujer" | "otro",
                                    }))
                                }
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white font-medium text-slate-800"
                            >
                                <option value="">{t.select}</option>
                                <option value="hombre">{t.genderOptions.male}</option>
                                <option value="mujer">{t.genderOptions.female}</option>
                                <option value="otro">{t.genderOptions.other}</option>
                            </select>
                        </div>
                    </div>

                    {/* Height */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t.height}</label>
                        <div className="flex items-center gap-3">
                            <UnitToggle
                                options={["ft", "cm"]}
                                selected={editedProfile.heightUnit || "cm"}
                                onChange={handleHeightUnitChange}
                            />
                            {(editedProfile.heightUnit || "cm") === "cm" ? (
                                <input
                                    type="number"
                                    value={editedProfile.height || ""}
                                    onChange={(e) =>
                                        setEditedProfile((prev) => ({
                                            ...prev,
                                            height: parseInt(e.target.value) || undefined,
                                        }))
                                    }
                                    placeholder="175"
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                                />
                            ) : (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="number"
                                        value={editedProfile.heightFeet || ""}
                                        onChange={(e) =>
                                            setEditedProfile((prev) => ({
                                                ...prev,
                                                heightFeet: parseInt(e.target.value) || undefined,
                                            }))
                                        }
                                        placeholder="5"
                                        className="w-16 px-3 py-3 border border-slate-200 rounded-xl text-sm text-center font-medium text-slate-800"
                                    />
                                    <span className="text-slate-600 text-sm">ft</span>
                                    <input
                                        type="number"
                                        value={editedProfile.heightInches || ""}
                                        onChange={(e) =>
                                            setEditedProfile((prev) => ({
                                                ...prev,
                                                heightInches: parseInt(e.target.value) || undefined,
                                            }))
                                        }
                                        placeholder="9"
                                        className="w-16 px-3 py-3 border border-slate-200 rounded-xl text-sm text-center font-medium text-slate-800"
                                    />
                                    <span className="text-slate-600 text-sm">in</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Weight */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t.weight}</label>
                        <div className="flex items-center gap-3">
                            <UnitToggle
                                options={["lb", "kg"]}
                                selected={editedProfile.weightUnit || "kg"}
                                onChange={handleWeightUnitChange}
                            />
                            <input
                                type="number"
                                value={editedProfile.weight || ""}
                                onChange={(e) =>
                                    setEditedProfile((prev) => ({
                                        ...prev,
                                        weight: parseInt(e.target.value) || undefined,
                                    }))
                                }
                                placeholder={(editedProfile.weightUnit || "kg") === "kg" ? "70" : "154"}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                            />
                        </div>
                    </div>

                    {/* Goal */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t.goal}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {GOAL_OPTIONS.map((goal) => (
                                <button
                                    key={goal}
                                    onClick={() => setEditedProfile((prev) => ({ ...prev, goal }))}
                                    className={`py-3 px-4 rounded-xl border-2 text-xs font-bold transition-all ${editedProfile.goal === goal
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                        : "border-slate-100 text-slate-600"
                                        }`}
                                >
                                    {goal}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Level */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                            {t.activityLabel}
                        </label>
                        <select
                            value={editedProfile.activityLevel || ""}
                            onChange={(e) =>
                                setEditedProfile((prev) => ({ ...prev, activityLevel: e.target.value }))
                            }
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white font-medium text-slate-800"
                        >
                            <option value="">{t.select}</option>
                            {ACTIVITY_LEVELS.map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Calorie Target */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                            {t.calorieTarget}
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setEditedProfile((prev) => ({
                                    ...prev,
                                    targetCalories: Math.max(500, (prev.targetCalories || 2000) - 100)
                                }))}
                                className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-bold text-xl active:scale-95"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                value={editedProfile.targetCalories || ""}
                                onChange={(e) =>
                                    setEditedProfile((prev) => ({
                                        ...prev,
                                        targetCalories: Math.max(500, parseInt(e.target.value) || 0)
                                    }))
                                }
                                placeholder="2000"
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-center text-slate-800"
                            />
                            <span className="text-xs text-slate-600 font-bold">kcal</span>
                            <button
                                type="button"
                                onClick={() => setEditedProfile((prev) => ({
                                    ...prev,
                                    targetCalories: (prev.targetCalories || 2000) + 100
                                }))}
                                className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-bold text-xl active:scale-95"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Allergies */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">{t.allergies}</label>
                        <div className="flex flex-wrap gap-2">
                            {ALLERGIES_OPTIONS.map((allergy) => (
                                <button
                                    key={allergy}
                                    onClick={() => toggleAllergy(allergy)}
                                    className={`py-2 px-3 rounded-full text-xs font-bold transition-all ${(editedProfile.allergies || []).includes(allergy)
                                        ? "bg-rose-100 text-rose-600 border border-rose-200"
                                        : "bg-slate-50 text-slate-600 border border-slate-100"
                                        }`}
                                >
                                    {allergy}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Diet Style */}
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">
                            {t.dietStyle}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DIET_OPTIONS.map((diet) => (
                                <button
                                    key={diet}
                                    onClick={() => toggleDiet(diet)}
                                    className={`py-2 px-3 rounded-full text-xs font-bold transition-all ${(editedProfile.dietStyle || []).includes(diet)
                                        ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                                        : "bg-slate-50 text-slate-600 border border-slate-100"
                                        }`}
                                >
                                    {diet}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
                    >
                        {tc.cancel}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:bg-emerald-400 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    >
                        {isSaving ? t.saving : tc.save}
                    </button>
                </div>
            </div>
        </AccessibleModal>
    );
}
