import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { profileRepository } from "@/repositories/profileRepository";
import { mealService } from "@/services/mealService";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import type { ApiResponse, Meal } from "@/types/api.types";

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

/**
 * GET /api/meals/today
 * Get today's meals with totals for the authenticated user.
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<ApiResponse<TodaySummary>>> {
    try {
        // 1. Authenticate user
        const { user, error: authError } = await getUser();
        if (authError || !user) {
            throw new ApiError(401, "Unauthorized");
        }

        // 2. Get profile for user
        const profile = await profileRepository.findByUserId(user.id);
        if (!profile) {
            throw new ApiError(404, "Profile not found");
        }

        // 3. Get today's summary
        const summary = await mealService.getTodaysSummary(profile.id);

        return NextResponse.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        return errorHandler(error, { route: "/api/meals/today" }) as NextResponse<
            ApiResponse<TodaySummary>
        >;
    }
}
