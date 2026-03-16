import { createClient } from "@/lib/supabase/server";
import type { Meal, DailyCalories } from "@/types/api.types";

export interface CreateMealData {
    user_id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image_url?: string;
    ingredients?: string[];
    detailed_ingredients?: Array<{ name: string; calories: number; safe: boolean; warning?: string | null }>;
    safety_status?: "safe" | "warning" | "danger";
    meal_time: string;
    coach_feedback?: string;
}

export interface MealFilters {
    userId: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

/**
 * Repository for meal data access operations.
 */
export const mealRepository = {
    /**
     * Find meals with filters.
     */
    async findAll(filters: MealFilters): Promise<Meal[]> {
        const supabase = await createClient();

        let query = supabase
            .from("meals")
            .select("id, user_id, name, calories, protein, carbs, fat, image_url, ingredients, detailed_ingredients, safety_status, coach_feedback, meal_time, created_at")
            .eq("user_id", filters.userId)
            .order("created_at", { ascending: false });

        if (filters.startDate) {
            query = query.gte("meal_time", filters.startDate.toISOString());
        }

        if (filters.endDate) {
            query = query.lte("meal_time", filters.endDate.toISOString());
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        if (filters.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch meals: ${error.message}`);
        }

        return (data ?? []) as Meal[];
    },

    /**
     * Find meal by ID.
     */
    async findById(id: string): Promise<Meal | null> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("meals")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Failed to fetch meal: ${error.message}`);
        }

        return data as Meal;
    },

    /**
     * Create a new meal.
     */
    async create(meal: CreateMealData): Promise<Meal> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("meals")
            .insert(meal)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create meal: ${error.message}`);
        }

        return data as Meal;
    },

    /**
     * Delete a meal.
     */
    async delete(id: string): Promise<void> {
        const supabase = await createClient();

        const { error } = await supabase.from("meals").delete().eq("id", id);

        if (error) {
            throw new Error(`Failed to delete meal: ${error.message}`);
        }
    },

    /**
     * Get today's meals for a user.
     * Uses timezone offset to calculate correct local date.
     * @param userId - User ID to fetch meals for
     * @param timezoneOffsetMinutes - User's timezone offset in minutes from getTimezoneOffset() (e.g., +300 for UTC-5)
     */
    async findTodaysMeals(userId: string, timezoneOffsetMinutes?: number): Promise<Meal[]> {
        const supabase = await createClient();

        // Calculate today's date in user's timezone
        const now = new Date();
        let localDate: Date;

        if (timezoneOffsetMinutes !== undefined) {
            // Adjust UTC time by the timezone offset to get user's local time
            // Note: getTimezoneOffset returns minutes, positive for behind UTC
            localDate = new Date(now.getTime() - timezoneOffsetMinutes * 60 * 1000);
        } else {
            // Fallback to server time (may cause issues if server is in different timezone)
            localDate = now;
        }

        const year = localDate.getUTCFullYear();
        const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(localDate.getUTCDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // Calculate the day boundaries in UTC
        // For a user in UTC-5 (getTimezoneOffset returns +300), their "today" starts at 05:00 UTC
        const dayStartUtc = new Date(`${todayStr}T00:00:00.000Z`);
        const dayEndUtc = new Date(`${todayStr}T23:59:59.999Z`);

        if (timezoneOffsetMinutes !== undefined) {
            // Adjust boundaries to match user's timezone
            dayStartUtc.setTime(dayStartUtc.getTime() + timezoneOffsetMinutes * 60 * 1000);
            dayEndUtc.setTime(dayEndUtc.getTime() + timezoneOffsetMinutes * 60 * 1000);
        }

        // Query meals where meal_time falls within user's local day
        const { data, error } = await supabase
            .from("meals")
            .select("id, user_id, name, calories, protein, carbs, fat, image_url, ingredients, detailed_ingredients, safety_status, coach_feedback, meal_time, created_at")
            .eq("user_id", userId)
            .gte("meal_time", dayStartUtc.toISOString())
            .lt("meal_time", dayEndUtc.toISOString())
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            throw new Error(`Failed to fetch today's meals: ${error.message}`);
        }

        return (data ?? []) as Meal[];
    },

    /**
     * Get daily calories summary.
     * Uses timezone offset to calculate correct local date.
     * @param userId - User ID to fetch calories for
     * @param date - Date to fetch calories for
     * @param timezoneOffsetMinutes - User's timezone offset in minutes from getTimezoneOffset() (e.g., +300 for UTC-5)
     */
    async getDailyCalories(
        userId: string,
        date: Date,
        timezoneOffsetMinutes?: number
    ): Promise<DailyCalories | null> {
        const supabase = await createClient();

        // Calculate the date in user's timezone
        let localDate: Date;

        if (timezoneOffsetMinutes !== undefined) {
            // Adjust UTC time by the timezone offset to get user's local date
            localDate = new Date(date.getTime() - timezoneOffsetMinutes * 60 * 1000);
        } else {
            localDate = date;
        }

        const year = localDate.getUTCFullYear();
        const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(localDate.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const { data, error } = await supabase
            .from("daily_calories")
            .select("*")
            .eq("user_id", userId)
            .eq("date", dateStr)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Failed to fetch daily calories: ${error.message}`);
        }

        return data as DailyCalories;
    },

    /**
     * Get daily calories for a date range.
     * Uses local date to avoid timezone issues.
     */
    async getDailyCaloriesRange(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<DailyCalories[]> {
        const supabase = await createClient();

        // Helper to format date in local timezone as YYYY-MM-DD
        const formatLocalDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const { data, error } = await supabase
            .from("daily_calories")
            .select("*")
            .eq("user_id", userId)
            .gte("date", formatLocalDate(startDate))
            .lte("date", formatLocalDate(endDate))
            .order("date", { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch daily calories range: ${error.message}`);
        }

        return (data ?? []) as DailyCalories[];
    },
};
