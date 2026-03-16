import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { profileRepository } from "@/repositories/profileRepository";
import { mealService } from "@/services/mealService";
import { mealRepository, type CreateMealData } from "@/repositories/mealRepository";
import { mealQuerySchema } from "@/lib/validations/meal.schema";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import type { ApiResponse, Meal } from "@/types/api.types";

/**
 * GET /api/meals
 * Get user's meal history with optional filtering.
 */
export async function GET(
    request: NextRequest
): Promise<NextResponse<ApiResponse<Meal[]>>> {
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

        // 3. Parse query params
        const searchParams = request.nextUrl.searchParams;
        const queryParams = mealQuerySchema.parse({
            days: searchParams.get("days"),
            limit: searchParams.get("limit"),
        });

        // 4. Get meal history
        const meals = await mealService.getMealHistory(
            profile.id,
            queryParams.days,
            queryParams.limit
        );

        return NextResponse.json({
            success: true,
            data: meals,
            meta: { total: meals.length },
        });
    } catch (error) {
        return errorHandler(error, { route: "/api/meals" }) as NextResponse<
            ApiResponse<Meal[]>
        >;
    }
}

/**
 * POST /api/meals
 * Save a meal directly (used after editing and confirming in scanner).
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<Meal>>> {
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

        // 3. Parse request body
        const body = await request.json();
        const {
            name,
            calories,
            protein,
            carbs,
            fat,
            ingredients,
            detailedIngredients,
            mealTime,
            safetyStatus,
            imageUrl,
            coachFeedback,
        } = body;

        if (!name || calories === undefined) {
            throw new ApiError(400, "Name and calories are required");
        }

        // 4. Create meal
        const mealData: CreateMealData = {
            user_id: profile.id,
            name,
            calories,
            protein: protein || 0,
            carbs: carbs || 0,
            fat: fat || 0,
            ingredients: ingredients || [],
            detailed_ingredients: detailedIngredients,
            safety_status: safetyStatus || "safe",
            image_url: imageUrl,
            coach_feedback: coachFeedback,
            meal_time: new Date().toISOString(),
        };

        const meal = await mealRepository.create(mealData);

        return NextResponse.json(
            {
                success: true,
                data: meal,
            },
            { status: 201 }
        );
    } catch (error) {
        return errorHandler(error, { route: "/api/meals" }) as NextResponse<
            ApiResponse<Meal>
        >;
    }
}
