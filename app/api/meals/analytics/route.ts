import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { profileRepository } from "@/repositories/profileRepository";
import { mealService } from "@/services/mealService";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import type { ApiResponse, DailyCalories } from "@/types/api.types";

/**
 * GET /api/meals/analytics
 * Get weekly analytics data for the authenticated user.
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<ApiResponse<DailyCalories[]>>> {
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

        // 3. Get weekly analytics
        const analytics = await mealService.getWeeklyAnalytics(profile.id);

        return NextResponse.json({
            success: true,
            data: analytics,
            meta: {
                total: analytics.length,
            },
        });
    } catch (error) {
        return errorHandler(error, { route: "/api/meals/analytics" }) as NextResponse<
            ApiResponse<DailyCalories[]>
        >;
    }
}
