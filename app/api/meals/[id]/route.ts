import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { profileRepository } from "@/repositories/profileRepository";
import { mealService } from "@/services/mealService";
import { mealRepository } from "@/repositories/mealRepository";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import type { ApiResponse, Meal } from "@/types/api.types";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/meals/[id]
 * Get a specific meal by ID.
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<ApiResponse<Meal>>> {
    try {
        const { id } = await params;

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

        // 3. Get meal
        const meal = await mealRepository.findById(id);
        if (!meal) {
            throw new ApiError(404, "Meal not found");
        }

        // 4. Verify ownership
        if (meal.user_id !== profile.id) {
            throw new ApiError(403, "Forbidden");
        }

        return NextResponse.json({
            success: true,
            data: meal,
        });
    } catch (error) {
        return errorHandler(error, { route: "/api/meals/[id]" }) as NextResponse<
            ApiResponse<Meal>
        >;
    }
}

/**
 * DELETE /api/meals/[id]
 * Delete a specific meal.
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<ApiResponse<null>>> {
    try {
        const { id } = await params;

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

        // 3. Delete meal (service verifies ownership)
        await mealService.deleteMeal(id, profile.id);

        return NextResponse.json(
            {
                success: true,
                data: null,
            },
            { status: 200 }
        );
    } catch (error) {
        return errorHandler(error, {
            route: "/api/meals/[id]",
        }) as NextResponse<ApiResponse<null>>;
    }
}
