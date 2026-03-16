import { createClient } from "@/lib/supabase/server";
import type { Profile, SubscriptionTier } from "@/types/api.types";

export interface UpdateProfileData {
    name?: string;
    age?: number;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    height_cm?: number;
    weight_kg?: number;
    goal?: "lose_weight" | "gain_muscle" | "maintain" | "eat_healthy";
    activity_level?: "sedentary" | "light" | "moderate" | "active" | "very_active";
    target_calories?: number;
    language_preference?: "es" | "en";
    theme_preference?: "light" | "dark";
}

/**
 * Repository for profile data access operations.
 */
export const profileRepository = {
    /**
     * Find profile by Supabase auth user ID.
     */
    async findByUserId(userId: string): Promise<Profile | null> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .is("deleted_at", null)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null; // Not found
            }
            throw new Error(`Failed to fetch profile: ${error.message}`);
        }

        return data as Profile;
    },

    /**
     * Find profile by profile ID.
     */
    async findById(id: string): Promise<Profile | null> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Failed to fetch profile: ${error.message}`);
        }

        return data as Profile;
    },

    /**
     * Update profile data.
     */
    async update(id: string, data: UpdateProfileData): Promise<Profile> {
        const supabase = await createClient();

        const { data: updated, error } = await supabase
            .from("profiles")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update profile: ${error.message}`);
        }

        return updated as Profile;
    },

    /**
     * Update subscription tier (called from webhook).
     */
    async updateSubscriptionTier(
        userId: string,
        tier: SubscriptionTier
    ): Promise<void> {
        const supabase = await createClient();

        const { error } = await supabase
            .from("profiles")
            .update({ subscription_tier: tier })
            .eq("user_id", userId);

        if (error) {
            throw new Error(`Failed to update subscription: ${error.message}`);
        }
    },

    /**
     * Soft delete profile.
     */
    async softDelete(id: string): Promise<void> {
        const supabase = await createClient();

        const { error } = await supabase
            .from("profiles")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            throw new Error(`Failed to delete profile: ${error.message}`);
        }
    },
};
