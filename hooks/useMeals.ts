"use client";

import { useState, useEffect, useCallback } from "react";
import type { Meal, DailyCalories, ApiResponse } from "@/types/api.types";

interface TodaySummary {
    meals: Meal[];
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        mealsCount: number;
    };
}

interface UseMealsResult {
    meals: Meal[];
    todaySummary: TodaySummary | null;
    weeklyAnalytics: DailyCalories[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching meal data from API.
 */
export function useMeals(): UseMealsResult {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
    const [weeklyAnalytics, setWeeklyAnalytics] = useState<DailyCalories[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [mealsRes, todayRes, analyticsRes] = await Promise.all([
                fetch("/api/meals?days=7&limit=50"),
                fetch("/api/meals/today"),
                fetch("/api/meals/analytics"),
            ]);

            if (!mealsRes.ok || !todayRes.ok || !analyticsRes.ok) {
                throw new Error("Failed to fetch data");
            }

            const mealsData: ApiResponse<Meal[]> = await mealsRes.json();
            const todayData: ApiResponse<TodaySummary> = await todayRes.json();
            const analyticsData: ApiResponse<DailyCalories[]> =
                await analyticsRes.json();

            if (mealsData.success && mealsData.data) {
                setMeals(mealsData.data);
            }
            if (todayData.success && todayData.data) {
                setTodaySummary(todayData.data);
            }
            if (analyticsData.success && analyticsData.data) {
                setWeeklyAnalytics(analyticsData.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        meals,
        todaySummary,
        weeklyAnalytics,
        isLoading,
        error,
        refetch: fetchData,
    };
}
