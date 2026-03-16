"use client";

import Image from "next/image";
import { type UserProfile } from "@/types/dashboard.types";
import { BMICard } from "@/components/ui/BMICard";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useDictionary, useLocale } from "@/contexts/DictionaryContext";
import { useRouter, usePathname } from "next/navigation";
import { type Locale, locales } from "@/modules/cores/i18n/src/config/locales";

interface ProfileTabProps {
    profile: UserProfile;
    onEditProfile: () => void;
    onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    onLogout: () => void;
}

// Profile info grid item
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="bg-slate-50 p-2.5 rounded-xl">
            <span className="text-slate-400 text-[10px]">{label}</span>
            <p className="font-bold text-slate-800 text-sm">{value}</p>
        </div>
    );
}

// Height display with units
function formatHeight(profile: UserProfile): string {
    if (profile.heightUnit === "ft") {
        return `${profile.heightFeet || 0}'${profile.heightInches || 0}"`;
    }
    return `${profile.height || "-"} cm`;
}

export function ProfileTab({ profile, onEditProfile, onUpdateProfile, onLogout }: ProfileTabProps) {
    const { canInstall, requestInstall } = usePWAInstall();
    const { dictionary } = useDictionary();
    const currentLocale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = dictionary.dashboard.profile;

    // Translate gender
    const translateGender = (gender: string | undefined): string => {
        if (!gender) return "-";
        const genderMap: Record<string, keyof typeof t.genderOptions> = {
            hombre: "male",
            mujer: "female",
            otro: "other",
            male: "male",
            female: "female",
            other: "other",
        };
        const key = genderMap[gender.toLowerCase()];
        return key ? t.genderOptions[key] : gender;
    };

    // Translate activity level
    const translateActivity = (activity: string | undefined): string => {
        if (!activity) return "-";
        const activityMap: Record<string, keyof typeof t.activityLevels> = {
            sedentario: "sedentary",
            sedentary: "sedentary",
            "ligeramente activo": "light",
            light: "light",
            moderado: "moderate",
            moderate: "moderate",
            activo: "active",
            active: "active",
            "muy activo": "very_active",
            very_active: "very_active",
        };
        const key = activityMap[activity.toLowerCase()];
        return key ? t.activityLevels[key] : activity;
    };

    // Translate goal
    const translateGoal = (goal: string | undefined): string => {
        if (!goal) return "-";
        const goalTranslations = dictionary.dashboard.goals;
        const goalMap: Record<string, keyof typeof goalTranslations> = {
            "perder peso": "lose_weight",
            "lose weight": "lose_weight",
            lose_weight: "lose_weight",
            "ganar músculo": "gain_muscle",
            "build muscle": "gain_muscle",
            gain_muscle: "gain_muscle",
            "mantener peso": "maintain",
            "maintain weight": "maintain",
            maintain: "maintain",
            "comer saludable": "eat_healthy",
            "eat healthy": "eat_healthy",
            eat_healthy: "eat_healthy",
        };
        const key = goalMap[goal.toLowerCase()];
        return (key && goalTranslations[key]) ? goalTranslations[key] : goal;
    };

    // Handle language change
    const handleLanguageChange = async (newLocale: Locale) => {
        if (newLocale === currentLocale) return;

        // 1. Update DB preference
        await onUpdateProfile({ languagePreference: newLocale });

        // 2. Update URL
        const segments = pathname.split("/");
        if (locales.includes(segments[1] as Locale)) {
            segments[1] = newLocale;
        }
        router.push(segments.join("/"));
    };

    return (
        <div className="space-y-4 animate-fadeIn pb-24">
            <h2 className="text-xl font-black text-slate-800">{t.title}</h2>

            <div className="bg-white p-4 sm:p-8 rounded-3xl sm:rounded-[48px] border border-slate-100 space-y-5 shadow-sm">
                {/* Profile Header */}
                <div className="text-center space-y-3">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[32px] bg-slate-100 overflow-hidden mx-auto ring-4 ring-slate-50 relative">
                        {profile.photoURL ? (
                            <Image
                                src={profile.photoURL}
                                fill
                                sizes="96px"
                                className="object-cover"
                                alt={`${t.profilePicAlt} ${profile.name}`}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl" aria-hidden="true">
                                👤
                            </div>
                        )}
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-lg sm:text-2xl font-black text-slate-800 truncate px-2">
                            {profile.name}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-400 truncate px-2">
                            {profile.email}
                        </p>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                    {/* Header with edit button */}
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {t.myInfo}
                        </span>
                        <button
                            type="button"
                            onClick={onEditProfile}
                            className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-widest transition-all duration-200 hover:text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded active:scale-95"
                        >
                            {t.edit}
                        </button>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <InfoItem label={t.age} value={`${profile.age || "-"} ${t.ageYears}`} />
                        <InfoItem
                            label={t.gender}
                            value={<span className="capitalize">{translateGender(profile.gender)}</span>}
                        />
                        <InfoItem label={t.height} value={formatHeight(profile)} />
                        <InfoItem
                            label={t.weight}
                            value={`${profile.weight || "-"} ${profile.weightUnit || "kg"}`}
                        />
                    </div>

                    {/* BMI Card */}
                    {profile.bmi && (
                        <BMICard
                            bmi={profile.bmi}
                            category={profile.bmiCategory as "bajo peso" | "normal" | "sobrepeso" | "obesidad" | null}
                        />
                    )}

                    {/* Goal & Activity */}
                    <InfoItem label={t.goal} value={translateGoal(profile.goal)} />
                    <InfoItem label={t.activity} value={translateActivity(profile.activityLevel)} />

                    {/* Allergies */}
                    {profile.allergies.length > 0 && (
                        <InfoItem label={t.allergies} value={profile.allergies.join(", ")} />
                    )}

                    {/* Diet Style */}
                    {profile.dietStyle.length > 0 && (
                        <InfoItem label={t.dietStyle} value={profile.dietStyle.join(", ")} />
                    )}

                    {/* Preferences Section */}
                    <div className="border-t border-slate-100 pt-6 mt-4 space-y-4">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {t.preferences.title}
                        </span>

                        <div className="space-y-3">
                            {/* Language Selector */}
                            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100/50 transition-all hover:bg-slate-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm shadow-sm ring-1 ring-slate-100">
                                        🌍
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{t.preferences.language}</span>
                                </div>
                                <select
                                    value={currentLocale}
                                    onChange={(e) => handleLanguageChange(e.target.value as Locale)}
                                    className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer hover:border-emerald-500/30 transition-all text-center"
                                >
                                    <option value="es">ESPAÑOL</option>
                                    <option value="en">ENGLISH</option>
                                </select>
                            </div>

                            {/* Theme Mock (Future) */}
                            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100/50 opacity-60">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm shadow-sm ring-1 ring-slate-100">
                                        ✨
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{t.preferences.theme}</span>
                                </div>
                                <div className="bg-slate-200 text-slate-400 text-[9px] font-black px-2 py-1 rounded-lg uppercase">
                                    {t.preferences.comingSoon}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Install App button - only shows if PWA can be installed */}
                {canInstall && (
                    <button
                        type="button"
                        onClick={requestInstall}
                        className="w-full py-3 text-emerald-600 font-black border-2 border-emerald-100 bg-emerald-50 rounded-xl text-[10px] uppercase tracking-widest transition-all duration-200 hover:bg-emerald-100 hover:border-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t.installApp}
                    </button>
                )}

                {/* Logout button */}
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full py-3 text-rose-500 font-black border-2 border-rose-50 rounded-xl text-[10px] uppercase tracking-widest transition-all duration-200 hover:bg-rose-50 hover:border-rose-100 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
                >
                    {t.logout}
                </button>
            </div>
        </div>
    );
}
