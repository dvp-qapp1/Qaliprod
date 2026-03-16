"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { type UserProfile } from "@/types/dashboard.types";

interface UseProfileResult {
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
    id: "",
    name: "Usuario",
    email: "",
    heightUnit: "cm",
    weightUnit: "kg",
    allergies: [],
    dietStyle: [],
};

export function useProfile(): UseProfileResult {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setProfile(DEFAULT_PROFILE);
                setIsLoading(false);
                return;
            }

            // Fetch profile from database
            const { data, error: fetchError } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (fetchError) {
                // If no profile exists, create basic one from user metadata
                const userProfile: UserProfile = {
                    id: user.id,
                    name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
                    email: user.email || "",
                    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                    heightUnit: "cm",
                    weightUnit: "kg",
                    allergies: [],
                    dietStyle: [],
                };
                setProfile(userProfile);
            } else {
                // Map database fields to UserProfile
                const userProfile: UserProfile = {
                    id: data.id,
                    name: data.name || user.user_metadata?.name || "Usuario",
                    email: data.email || user.email || "",
                    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                    age: data.age,
                    gender: data.gender,
                    height: data.height_cm,
                    heightUnit: "cm",
                    weight: data.weight_kg,
                    weightUnit: "kg",
                    goal: data.goal,
                    activityLevel: data.activity_level,
                    allergies: data.allergies || [],
                    dietStyle: data.diet_style || [],
                    bmi: data.bmi,
                    bmiCategory: data.bmi ? getBMICategory(data.bmi) : undefined,
                    targetCalories: data.target_calories,
                    languagePreference: data.language_preference,
                    themePreference: data.theme_preference,
                };
                setProfile(userProfile);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("Error al cargar el perfil");
            setProfile(DEFAULT_PROFILE);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        if (!profile) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dbUpdates: Record<string, unknown> = {};

        if (updates.age !== undefined) dbUpdates.age = updates.age;
        if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
        if (updates.height !== undefined) dbUpdates.height_cm = updates.height;
        if (updates.weight !== undefined) dbUpdates.weight_kg = updates.weight;
        // Only send goal if it's a valid non-empty value
        if (updates.goal !== undefined && updates.goal && updates.goal.trim() !== '') {
            dbUpdates.goal = updates.goal;
        }
        if (updates.activityLevel !== undefined) dbUpdates.activity_level = updates.activityLevel;
        if (updates.allergies !== undefined) dbUpdates.allergies = updates.allergies;
        if (updates.dietStyle !== undefined) dbUpdates.diet_style = updates.dietStyle;
        if (updates.targetCalories !== undefined) dbUpdates.target_calories = updates.targetCalories;
        if (updates.languagePreference !== undefined) dbUpdates.language_preference = updates.languagePreference;
        if (updates.themePreference !== undefined) dbUpdates.theme_preference = updates.themePreference;

        // Recalculate BMI if weight or height changed
        const newHeight = updates.height ?? profile.height;
        const newWeight = updates.weight ?? profile.weight;
        if ((updates.height !== undefined || updates.weight !== undefined) && newHeight && newWeight) {
            const heightM = newHeight / 100;
            const bmi = Math.round((newWeight / (heightM * heightM)) * 10) / 10;
            dbUpdates.bmi = bmi;
            updates.bmi = bmi;
            updates.bmiCategory = getBMICategory(bmi);
        }

        const { error } = await supabase
            .from("profiles")
            .update(dbUpdates)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error updating profile:", error);
            throw error;
        }

        setProfile((prev) => prev ? { ...prev, ...updates } : prev);
    }, [profile, supabase]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return {
        profile,
        isLoading,
        error,
        refetch: fetchProfile,
        updateProfile,
    };
}

// Helper to get BMI category
function getBMICategory(bmi: number): string {
    if (bmi < 18.5) return "bajo peso";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "sobrepeso";
    return "obesidad";
}
