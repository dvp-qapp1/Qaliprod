import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { profileRepository } from "@/repositories/profileRepository";
import { mealService } from "@/services/mealService";
import { analyzeSchema } from "@/lib/validations/meal.schema";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import type { ApiResponse, AnalyzedMeal } from "@/types/api.types";

/**
 * POST /api/meals/analyze
 * Analyze a food image OR text description with Gemini AI and save as a meal.
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<AnalyzedMeal>>> {
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

        // 3. Validate request body
        const body = await request.json();
        const validated = analyzeSchema.parse(body);

        let meal;

        // 4. Analyze based on input type
        if (validated.imageBase64) {
            // Image analysis
            meal = await mealService.analyzeAndSave(
                validated.imageBase64,
                profile.id,
                user.id,
                profile.subscription_tier
            );
        } else if (validated.description) {
            // Text/voice description analysis
            const result = await mealService.analyzeTextAndSave(
                validated.description,
                profile.id,
                user.id,
                profile.subscription_tier,
                profile.allergies || [],
                profile.diet_style
            );

            // Check if it was detected as food
            if (!result.isFood) {
                throw new ApiError(400, "No se detectó ningún alimento en esa descripción.");
            }

            meal = result;
        } else {
            throw new ApiError(400, "Either imageBase64 or description is required");
        }

        return NextResponse.json(
            {
                success: true,
                data: meal,
            },
            { status: 201 }
        );
    } catch (error) {
        return errorHandler(error, { route: "/api/meals/analyze" }) as NextResponse<
            ApiResponse<AnalyzedMeal>
        >;
    }
}
