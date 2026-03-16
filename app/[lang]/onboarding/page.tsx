"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { QaliaLogo } from "@/components/ui/QaliaLogo";
import { UnitToggle } from "@/components/ui/UnitToggle";
import { BMICard } from "@/components/ui/BMICard";
import { useDictionary, useLocale } from "@/contexts/DictionaryContext";
import { locales, defaultLocale, type Locale } from "@/modules/cores/i18n/src/config/locales";
import {
    OnboardingData,
    INITIAL_ONBOARDING_DATA,
    ALLERGIES_OPTIONS,
    GOAL_OPTIONS,
    DIET_OPTIONS,
    ACTIVITY_LEVELS,
    ACTIVITY_DESCRIPTIONS,
    DIET_DESCRIPTIONS,
    type Allergy,
    type Goal,
    type DietStyle,
    type ActivityLevel,
    type Gender,
    type WeightUnit,
    type HeightUnit,
} from "@/types/onboarding.types";
import { CalorieTargetWidget } from "@/components/ui/CalorieTargetWidget";
import {
    calculateBMI,
    convertWeight,
    convertCmToFeetInches,
    convertHeightToCm,
    getWeightValidation,
    isWeightValid,
    isHeightValid,
} from "@/lib/utils/bmiCalculator";
import { createClient } from "@/lib/supabase/client";

const TOTAL_STEPS = 10;

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();
    const { dictionary } = useDictionary();
    const locale = useLocale();
    const t = dictionary.onboarding;

    const [step, setStep] = useState(1);
    const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
    const [customAllergy, setCustomAllergy] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Pre-load existing profile data so returning users see their current values
    useEffect(() => {
        async function loadExistingProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { setIsLoading(false); return; }

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();

                if (!profile) { setIsLoading(false); return; }

                // Reverse-map DB English values → Onboarding Spanish values
                const goalFromDB: Record<string, Goal> = {
                    lose_weight: "Perder peso",
                    gain_muscle: "Ganar músculo",
                    maintain: "Mantener peso",
                    eat_healthy: "Mejorar energía",
                };
                const activityFromDB: Record<string, ActivityLevel> = {
                    sedentary: "Sedentario",
                    light: "Ligeramente Activo",
                    moderate: "Moderado",
                    active: "Muy Activo",
                    very_active: "Muy Activo",
                };
                const genderFromDB: Record<string, Gender> = {
                    male: "hombre",
                    female: "mujer",
                    other: "otro",
                };

                setData((prev) => ({
                    ...prev,
                    allergies: profile.allergies?.length ? profile.allergies : prev.allergies,
                    goal: goalFromDB[profile.goal] || (profile.goal as Goal) || prev.goal,
                    dietStyle: profile.diet_style?.length ? profile.diet_style as DietStyle[] : prev.dietStyle,
                    age: profile.age ?? prev.age,
                    gender: genderFromDB[profile.gender] || (profile.gender as Gender) || prev.gender,
                    height: profile.height_cm ? Math.round(Number(profile.height_cm)) : prev.height,
                    weight: profile.weight_kg ? Math.round(Number(profile.weight_kg)) : prev.weight,
                    activityLevel: activityFromDB[profile.activity_level] || (profile.activity_level as ActivityLevel) || prev.activityLevel,
                    targetCalories: profile.target_calories ?? prev.targetCalories,
                    bmi: profile.bmi ? Number(profile.bmi) : prev.bmi,
                }));
            } catch (err) {
                console.error("Error loading profile:", err);
            } finally {
                setIsLoading(false);
            }
        }

        loadExistingProfile();
    }, []);

    // Translation helpers
    const getTranslatedGoal = (g: string) => {
        const goalMap: Record<string, string> = {
            "Perder peso": t.goalOptions.loseWeight,
            "Ganar músculo": t.goalOptions.gainMuscle,
            "Mantener peso": t.goalOptions.maintain,
            "Mejorar energía": t.goalOptions.improveEnergy,
            "Mejorar digestión": t.goalOptions.improveDigestion
        };
        return goalMap[g] || g;
    };

    const getTranslatedDiet = (d: string) => {
        const dietMap: Record<string, string> = {
            "Omnívoro": locale === "es" ? "Omnívoro" : "Omnivore",
            "Vegetariano": locale === "es" ? "Vegetariano" : "Vegetarian",
            "Vegano": locale === "es" ? "Vegano" : "Vegan",
            "Pescetariano": locale === "es" ? "Pescetariano" : "Pescetarian",
            "Keto": locale === "es" ? "Keto" : "Keto",
            "Sin gluten": locale === "es" ? "Sin gluten" : "Gluten-free",
            "Sin lactosa": locale === "es" ? "Sin lactosa" : "Lactose-free"
        };
        return dietMap[d] || d;
    };

    const getTranslatedAllergy = (a: string) => {
        const allergyMap: Record<string, string> = {
            "Gluten": locale === "es" ? "Gluten" : "Gluten",
            "Lácteos": locale === "es" ? "Lácteos" : "Dairy",
            "Nueces": locale === "es" ? "Nueces" : "Nuts",
            "Maní": locale === "es" ? "Maní" : "Peanuts",
            "Mariscos": locale === "es" ? "Mariscos" : "Shellfish",
            "Soja": locale === "es" ? "Soja" : "Soy",
            "Huevo": locale === "es" ? "Huevo" : "Egg",
            "Pescado": locale === "es" ? "Pescado" : "Fish"
        };
        return allergyMap[a] || a;
    };

    const getTranslatedActivity = (acc: string) => {
        const activityMap: Record<string, string> = {
            "Sedentario": t.activityOptions.sedentary,
            "Ligeramente Activo": t.activityOptions.light,
            "Moderado": t.activityOptions.moderate,
            "Muy Activo": t.activityOptions.active
        };
        return activityMap[acc] || acc;
    };

    const getTranslatedActivityDescription = (acc: string) => {
        const descMap: Record<string, string> = {
            "Sedentario": t.activityDescriptions.sedentary,
            "Ligeramente Activo": t.activityDescriptions.light,
            "Moderado": t.activityDescriptions.moderate,
            "Muy Activo": t.activityDescriptions.active
        };
        return descMap[acc] || acc;
    };

    const getDietDescription = (d: string) => {
        const key = DIET_DESCRIPTIONS[d as DietStyle];
        return key ? (t as any).dietDescriptions[key] : "";
    };

    // Calculate BMI in real-time
    const bmiResult = useMemo(() => {
        if (!data.weight || !data.height) return null;

        const weight = typeof data.weight === "number" ? data.weight : 0;
        const height = typeof data.height === "number" ? data.height : 0;
        const heightFeet = typeof data.heightFeet === "number" ? data.heightFeet : 0;
        const heightInches = typeof data.heightInches === "number" ? data.heightInches : 0;

        if (weight <= 0) return null;
        if (data.heightUnit === "cm" && height <= 0) return null;
        if (data.heightUnit === "ft" && heightFeet <= 0 && heightInches <= 0) return null;

        return calculateBMI(weight, height, data.weightUnit, data.heightUnit, heightFeet, heightInches);
    }, [data.weight, data.height, data.weightUnit, data.heightUnit, data.heightFeet, data.heightInches]);

    // Update BMI in state when calculated
    useEffect(() => {
        if (bmiResult && bmiResult.value > 0) {
            setData((d) => ({
                ...d,
                bmi: bmiResult.value,
                bmiCategory: bmiResult.category,
            }));
        }
    }, [bmiResult?.value, bmiResult?.category]);

    const next = () => setStep((s) => s + 1);
    const back = () => setStep((s) => s - 1);

    // Recommended Calories Calculation
    const recommendedCalories = useMemo(() => {
        const weight = typeof data.weight === "number" ? data.weight : 70;
        const height = typeof data.height === "number" ? data.height : 170;
        const age = typeof data.age === "number" ? data.age : 25;

        // Basic BMR calculation (Mifflin-St Jeor)
        let bmr = 0;
        if (data.gender === "hombre") {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        // Activity multiplier
        const multipliers: Record<string, number> = {
            "Sedentario": 1.2,
            "Ligeramente Activo": 1.375,
            "Moderado": 1.55,
            "Muy Activo": 1.725,
        };
        const maintenance = bmr * (multipliers[data.activityLevel || "Moderado"] || 1.55);

        // Goal adjustment
        if (data.goal === "Perder peso") return Math.round(maintenance * 0.85);
        if (data.goal === "Ganar músculo") return Math.round(maintenance * 1.1);
        return Math.round(maintenance);
    }, [data.weight, data.height, data.age, data.gender, data.activityLevel, data.goal]);

    // Initialize targetCalories once we have a recommendation
    useEffect(() => {
        if (data.targetCalories === null && recommendedCalories > 0) {
            setData(d => ({ ...d, targetCalories: recommendedCalories }));
        }
    }, [recommendedCalories]);

    const toggleAllergy = (allergy: Allergy) => {
        setData((prev) => ({
            ...prev,
            allergies: prev.allergies.includes(allergy)
                ? prev.allergies.filter((a) => a !== allergy)
                : [...prev.allergies, allergy],
        }));
    };

    const addCustomAllergy = () => {
        if (customAllergy.trim() && !data.allergies.includes(customAllergy.trim())) {
            setData((prev) => ({
                ...prev,
                allergies: [...prev.allergies, customAllergy.trim()],
            }));
            setCustomAllergy("");
        }
    };

    const toggleDiet = (diet: DietStyle) => {
        setData((prev) => ({
            ...prev,
            dietStyle: prev.dietStyle.includes(diet)
                ? prev.dietStyle.filter((d) => d !== diet)
                : [...prev.dietStyle, diet],
        }));
    };

    // Weight unit change with conversion
    const handleWeightUnitChange = (unit: string) => {
        const newUnit = unit as WeightUnit;
        if (newUnit === data.weightUnit) return;

        if (data.weight && typeof data.weight === "number") {
            const convertedWeight = convertWeight(data.weight, data.weightUnit, newUnit);
            setData((d) => ({ ...d, weightUnit: newUnit, weight: Math.round(convertedWeight) }));
        } else {
            setData((d) => ({ ...d, weightUnit: newUnit }));
        }
    };

    // Height unit change with conversion
    const handleHeightUnitChange = (unit: string) => {
        const newUnit = unit as HeightUnit;
        if (newUnit === data.heightUnit) return;

        if (newUnit === "ft" && data.height && typeof data.height === "number") {
            const { feet, inches } = convertCmToFeetInches(data.height);
            setData((d) => ({ ...d, heightUnit: newUnit, heightFeet: feet, heightInches: inches }));
        } else if (newUnit === "cm") {
            const feet = typeof data.heightFeet === "number" ? data.heightFeet : 0;
            const inches = typeof data.heightInches === "number" ? data.heightInches : 0;
            if (feet > 0 || inches > 0) {
                const cm = convertHeightToCm(feet, inches);
                setData((d) => ({ ...d, heightUnit: newUnit, height: cm }));
            } else {
                setData((d) => ({ ...d, heightUnit: newUnit }));
            }
        }
    };

    // Validation for each step
    const isStepValid = () => {
        switch (step) {
            case 1:
                return true;
            case 2:
                return data.allergies.length > 0;
            case 3:
                return !!data.goal;
            case 4:
                return data.dietStyle.length > 0;
            case 5:
                return data.age !== "" && !!data.gender;
            case 6:
                if (data.heightUnit === "ft") {
                    return isHeightValid(
                        0, "ft",
                        typeof data.heightFeet === "number" ? data.heightFeet : 0,
                        typeof data.heightInches === "number" ? data.heightInches : 0
                    );
                }
                return data.height !== "" && isHeightValid(Number(data.height), "cm");
            case 7:
                return data.weight !== "" && isWeightValid(Number(data.weight), data.weightUnit);
            case 8:
                return !!data.activityLevel;
            case 9:
                return data.targetCalories !== null && data.targetCalories >= 500;
            case 10:
                return true;
            default:
                return true;
        }
    };

    const getWeightRange = () => {
        const { min, max } = getWeightValidation(data.weightUnit);
        return `${min}${data.weightUnit} - ${max}${data.weightUnit}`;
    };

    // Save profile to Supabase
    const handleFinalize = async () => {
        setIsSyncing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Update profile in database with user_id
                await supabase.from("profiles").upsert({
                    user_id: user.id,
                    email: user.email || "",
                    name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
                    allergies: data.allergies,
                    goal: data.goal,
                    diet_style: data.dietStyle,
                    age: data.age || null,
                    gender: data.gender,
                    height_cm: data.heightUnit === "cm"
                        ? data.height
                        : convertHeightToCm(
                            typeof data.heightFeet === "number" ? data.heightFeet : 0,
                            typeof data.heightInches === "number" ? data.heightInches : 0
                        ),
                    weight_kg: data.weightUnit === "kg"
                        ? data.weight
                        : typeof data.weight === "number"
                            ? data.weight * 0.453592
                            : null,
                    activity_level: data.activityLevel,
                    target_calories: data.targetCalories,
                    bmi: data.bmi,
                    language_preference: locale,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id" });
            }

            router.push(`/${locale}/dashboard`);
        } catch (error) {
            console.error("Error saving profile:", error);
            router.push("/dashboard");
        } finally {
            setIsSyncing(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="flex flex-col items-center text-center px-6 py-12 animate-fadeInUp flex-1 justify-center">
                        <div className="relative mb-12">
                            <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center shadow-2xl shadow-emerald-100 ring-8 ring-emerald-50/50">
                                <QaliaLogo className="w-16 h-16 text-emerald-600" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-black mb-6 text-slate-900 tracking-tight leading-tight">
                            {t.welcome.title}
                        </h1>
                        <p className="text-slate-500 text-lg leading-relaxed mb-12 font-medium max-w-[280px]">
                            {t.welcome.description}
                        </p>
                        <button
                            onClick={next}
                            disabled={isSyncing}
                            className="w-full max-w-[280px] py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <span>{t.welcome.startButton}</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                );

            case 2:
                return (
                    <div className="flex flex-col animate-fadeInUp flex-1 justify-center py-12">
                        <h2 className="text-2xl font-bold mb-2 text-slate-900">{t.allergies.title}</h2>
                        <p className="text-slate-600 mb-8 font-medium">
                            {t.allergies.subtitle}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {ALLERGIES_OPTIONS.map((a) => (
                                <button
                                    key={a}
                                    onClick={() => toggleAllergy(a)}
                                    className={`py-4 px-2 rounded-2xl border-2 transition-all font-bold ${data.allergies.includes(a)
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                        : "border-gray-100 bg-white text-slate-500"
                                        }`}
                                >
                                    {getTranslatedAllergy(a)}
                                </button>
                            ))}
                        </div>

                        <div className="mb-8">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
                                {t.allergies.otherLabel}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={customAllergy}
                                    onChange={(e) => setCustomAllergy(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addCustomAllergy()}
                                    placeholder={t.allergies.placeholder}
                                    className="w-full bg-white border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                                />
                                <button
                                    onClick={addCustomAllergy}
                                    className="absolute right-2 top-2 bottom-2 bg-emerald-50 text-emerald-600 px-4 rounded-xl font-bold text-sm active:scale-95"
                                >
                                    {t.allergies.addAllergyButton}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-auto">
                            <button
                                onClick={() => {
                                    setData((d) => ({ ...d, allergies: [] }));
                                    next();
                                }}
                                className="w-full py-4 bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold shadow-sm hover:bg-slate-100 transition-all active:scale-95"
                            >
                                {t.allergies.noAllergiesButton}
                            </button>
                            <button
                                onClick={next}
                                disabled={!isStepValid()}
                                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {t.allergies.continueButton}
                            </button>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="flex flex-col animate-fadeInUp flex-1 justify-center py-12">
                        <h2 className="text-2xl font-bold mb-2 text-slate-900">{t.goals.title}</h2>
                        <p className="text-slate-600 mb-8 font-medium">
                            {t.goals.subtitle}
                        </p>
                        <div className="flex flex-col gap-3 mb-10">
                            {GOAL_OPTIONS.map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setData((prev) => ({ ...prev, goal: g }))}
                                    className={`py-5 px-6 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${data.goal === g
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-gray-100 bg-white"
                                        }`}
                                >
                                    <span className={`font-bold ${data.goal === g ? "text-emerald-600" : "text-slate-600"}`}>
                                        {getTranslatedGoal(g)}
                                    </span>
                                    {data.goal === g && (
                                        <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={next}
                            disabled={!isStepValid()}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold disabled:opacity-30 shadow-lg"
                        >
                            {t.goals.nextButton}
                        </button>
                    </div>
                );

            case 4:
                return (
                    <div className="flex flex-col animate-fadeInUp flex-1 justify-center py-12">
                        <h2 className="text-2xl font-bold mb-2 text-slate-900">{t.diet.title}</h2>
                        <p className="text-slate-600 mb-8 font-medium">
                            {t.diet.subtitle}
                        </p>
                        <div className="grid grid-cols-1 gap-2 mb-6">
                            {DIET_OPTIONS.map((d) => (
                                <button
                                    key={d}
                                    onClick={() => toggleDiet(d)}
                                    className={`py-3 px-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${data.dietStyle.includes(d)
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-gray-100 bg-white"
                                        }`}
                                >
                                    <div className="flex flex-col">
                                        <span className={`font-bold text-sm ${data.dietStyle.includes(d) ? "text-emerald-600" : "text-slate-600"}`}>
                                            {getTranslatedDiet(d)}
                                        </span>
                                        <span className="text-[11px] text-slate-400 mt-0.5">
                                            {getDietDescription(d)}
                                        </span>
                                    </div>
                                    {data.dietStyle.includes(d) && (
                                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={next}
                            disabled={!isStepValid()}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold disabled:opacity-30 shadow-lg"
                        >
                            {t.diet.continueButton}
                        </button>
                    </div>
                );

            case 5:
                return (
                    <div className="flex flex-col animate-fadeInUp flex-1 justify-center py-12">
                        <h2 className="text-2xl font-bold mb-2 text-slate-900">{t.personal.title}</h2>
                        <p className="text-slate-600 mb-8 font-medium">
                            {t.personal.subtitle}
                        </p>

                        <div className="flex flex-col gap-6 mb-10">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    {t.personal.ageLabel}
                                </label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={data.age}
                                    onChange={(e) => setData((d) => ({ ...d, age: parseInt(e.target.value) || "" }))}
                                    className="p-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-2xl text-center"
                                    placeholder={t.personal.agePlaceholder}
                                    min={10}
                                    max={120}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    {t.personal.genderLabel}
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(["hombre", "mujer", "otro"] as const).map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setData((d) => ({ ...d, gender: g }))}
                                            className={`py-4 rounded-2xl border-2 transition-all font-bold capitalize ${data.gender === g
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                                : "border-gray-100 bg-white text-slate-500"
                                                }`}
                                        >
                                            {g === "hombre" ? t.genderOptions.male : g === "mujer" ? t.genderOptions.female : t.genderOptions.other}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={next}
                            disabled={!isStepValid()}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold mt-auto disabled:opacity-30 shadow-lg"
                        >
                            {t.personal.continueButton}
                        </button>
                    </div>
                );

            case 6:
                return (
                    <div className="flex flex-col animate-fadeInUp flex-1 justify-center py-12">
                        <h2 className="text-2xl font-bold mb-2 text-slate-900">{t.height.title}</h2>
                        <p className="text-slate-600 mb-6 font-medium">
                            {t.height.subtitle}
                        </p>

                        <UnitToggle
                            options={["ft", "cm"]}
                            selected={data.heightUnit}
                            onChange={handleHeightUnitChange}
                        />

                        <div className="mt-8 flex justify-center items-end gap-4">
                            {data.heightUnit === "cm" ? (
                                <div className="flex flex-col items-center">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={data.height}
                                        onChange={(e) => setData((d) => ({ ...d, height: parseInt(e.target.value) || "" }))}
                                        className="w-32 p-4 bg-white border-b-4 border-slate-200 focus:border-emerald-500 outline-none font-black text-5xl text-center transition-colors"
                                        placeholder="175"
                                        min={100}
                                        max={250}
                                    />
                                    <span className="text-slate-500 font-bold mt-2">cm</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col items-center">
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            value={data.heightFeet}
                                            onChange={(e) => setData((d) => ({ ...d, heightFeet: parseInt(e.target.value) || "" }))}
                                            className="w-20 p-4 bg-white border-b-4 border-slate-200 focus:border-emerald-500 outline-none font-black text-5xl text-center transition-colors"
                                            placeholder="5"
                                            min={3}
                                            max={8}
                                        />
                                        <span className="text-slate-500 font-bold mt-2">ft</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            value={data.heightInches}
                                            onChange={(e) => setData((d) => ({ ...d, heightInches: parseInt(e.target.value) || "" }))}
                                            className="w-20 p-4 bg-white border-b-4 border-slate-200 focus:border-emerald-500 outline-none font-black text-5xl text-center transition-colors"
                                            placeholder="9"
                                            min={0}
                                            max={11}
                                        />
                                        <span className="text-slate-500 font-bold mt-2">in</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <p className="text-center text-sm text-slate-500 mt-4">
                            {t.height.hint
                                .replace("{min}", data.heightUnit === "cm" ? "100cm" : "3'3\"")
                                .replace("{max}", data.heightUnit === "cm" ? "250cm" : "8'2\"")
                            }
                        </p>

                        <BMICard isCalculating={true} bmi={null} category={null} />

                        <button
                            onClick={next}
                            disabled={!isStepValid()}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold mt-auto disabled:opacity-30 shadow-lg"
                        >
                            {t.height.continueButton}
                        </button>
                    </div>
                );

            case 7:
                return (
                    <div className="flex flex-col animate-fadeInUp flex-1 justify-center py-12">
                        <h2 className="text-2xl font-bold mb-2 text-slate-900">{t.weight.title}</h2>
                        <p className="text-slate-600 mb-6 font-medium">
                            {t.weight.subtitle}
                        </p>

                        <UnitToggle
                            options={["lb", "kg"]}
                            selected={data.weightUnit}
                            onChange={handleWeightUnitChange}
                        />

                        <div className="mt-8 flex justify-center items-end">
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={data.weight}
                                    onChange={(e) => setData((d) => ({ ...d, weight: parseInt(e.target.value) || "" }))}
                                    className="w-36 p-4 bg-white border-b-4 border-slate-200 focus:border-emerald-500 outline-none font-black text-5xl text-center transition-colors"
                                    placeholder={data.weightUnit === "kg" ? "70" : "154"}
                                    min={data.weightUnit === "kg" ? 25 : 55}
                                    max={data.weightUnit === "kg" ? 300 : 660}
                                />
                                <span className="text-slate-500 font-bold mt-2">{data.weightUnit}</span>
                            </div>
                        </div>

                        <p className="text-center text-sm text-slate-500 mt-4">
                            {t.weight.hint.replace("{range}", getWeightRange())}
                        </p>

                        {bmiResult && bmiResult.value > 0 ? (
                            <BMICard bmi={bmiResult.value} category={bmiResult.category} goal={getTranslatedGoal(data.goal || "")} showFullMessage />
                        ) : (
                            <BMICard isCalculating bmi={null} category={null} />
                        )}

                        <button
                            onClick={next}
                            disabled={!isStepValid()}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold mt-auto disabled:opacity-30 shadow-lg"
                        >
                            {t.weight.continueButton}
                        </button>
                    </div>
                );

            case 8:
                return (
                    <div className="flex flex-col animate-fadeInUp flex-1 justify-center py-12">
                        <h2 className="text-2xl font-bold mb-2 text-slate-900">{t.activity.title}</h2>
                        <p className="text-slate-600 mb-8 font-medium">
                            {t.activity.subtitle}
                        </p>
                        <div className="flex flex-col gap-3 mb-10">
                            {ACTIVITY_LEVELS.map((acc) => (
                                <button
                                    key={acc}
                                    onClick={() => setData((prev) => ({ ...prev, activityLevel: acc }))}
                                    className={`py-5 px-6 rounded-2xl border-2 text-left flex flex-col transition-all ${data.activityLevel === acc
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-gray-100 bg-white"
                                        }`}
                                >
                                    <span className={`font-bold ${data.activityLevel === acc ? "text-emerald-600" : "text-slate-600"}`}>
                                        {getTranslatedActivity(acc)}
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1">
                                        {getTranslatedActivityDescription(acc)}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={next}
                            disabled={!isStepValid()}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold disabled:opacity-30 shadow-lg"
                        >
                            {t.activity.nextButton}
                        </button>
                    </div>
                );

            case 9:
                return (
                    <div className="flex flex-col animate-fadeInUp flex-1 justify-center py-12">
                        <h2 className="text-2xl font-bold mb-2 text-slate-900">{t.targetCalories.title}</h2>
                        <p className="text-slate-600 mb-8 font-medium">
                            {t.targetCalories.subtitle}
                        </p>

                        <CalorieTargetWidget
                            value={typeof data.targetCalories === "number" ? data.targetCalories : recommendedCalories}
                            onChange={(val) => setData(d => ({ ...d, targetCalories: val }))}
                            recommendedCalories={recommendedCalories}
                            gender={data.gender || "otro"}
                            goal={data.goal}
                        />

                        <button
                            onClick={next}
                            disabled={!isStepValid()}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold mt-12 shadow-lg"
                        >
                            {t.targetCalories.nextButton}
                        </button>
                    </div>
                );

            case 10:
                return (
                    <div className="flex flex-col items-center justify-center text-center animate-fadeInUp flex-1 py-12">
                        <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mb-10 animate-bounce">
                            <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4">{t.finish.title}</h2>
                        <p className="text-slate-600 text-lg leading-relaxed mb-12 font-medium">
                            {t.finish.successMessage}
                        </p>
                        <button
                            onClick={handleFinalize}
                            disabled={isSyncing}
                            className="w-full max-w-sm py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 transition-transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSyncing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{locale === "es" ? "Guardando..." : "Saving..."}</span>
                                </>
                            ) : (
                                t.finish.finalizeButton
                            )}
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col relative overflow-hidden text-slate-900">
            {/* Loading state while fetching existing profile */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </div>
            ) : (
            <>
            {/* Progress Bar Header */}
            {step > 1 && step < 10 && (
                <div className="px-6 py-8 flex items-center justify-between z-10 bg-white shadow-sm border-b border-slate-50">
                    <button onClick={back} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex gap-1.5">
                        {[...Array(TOTAL_STEPS)].map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-500 bg-gray-200 ${step >= i + 1 ? "bg-emerald-500 w-4" : "w-2"
                                    } ${step === i + 1 ? "w-8" : ""}`}
                            />
                        ))}
                    </div>
                    <div className="w-6" />
                </div>
            )}

            <main className="flex-1 flex flex-col px-6">
                {renderStep()}
            </main>
            </>
            )}
        </div>
    );
}
