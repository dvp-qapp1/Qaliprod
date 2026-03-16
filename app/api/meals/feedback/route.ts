import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { profileRepository } from "@/repositories/profileRepository";
import { mealService } from "@/services/mealService";
import { buildEnrichedProfile, buildTodayContext } from "@/services/profileContext";
import { buildCoachingPrompt } from "@/lib/prompts/coaching";
import { model } from "@/lib/gemini/client";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import type { ApiResponse } from "@/types/api.types";
import type { MealTime, IngredientAnalysis } from "@/types/meal.types";

interface FeedbackRequest {
    report: {
        name: string;
        calories: number;
        macros: {
            protein: number;
            carbs: number;
            fat: number;
        };
        ingredients: Array<{ name: string; safe?: boolean; warning?: string | null }>;
    };
    mealTime: MealTime;
    locale?: "en" | "es";
}

interface FeedbackResponse {
    feedback: string;
    context?: {
        caloriesRemaining: number;
        proteinRemaining: number;
        dailyProgress: number; // percentage
    };
}

/**
 * POST /api/meals/feedback
 * Get personalized coach feedback using enriched profile context and goal-specific prompts.
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<FeedbackResponse>>> {
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
        const body: FeedbackRequest = await request.json();
        const { report, mealTime, locale = "es" } = body;

        if (!report || !mealTime) {
            throw new ApiError(400, "Report and mealTime are required");
        }

        // 4. Get today's meal history
        const todayMeals = await mealService.getTodaysMeals(profile.id);

        // 5. Build enriched context
        const enrichedProfile = buildEnrichedProfile(profile);
        const todayContext = buildTodayContext(todayMeals);

        // 6. Transform ingredients to include safety info
        const ingredients: IngredientAnalysis[] = report.ingredients.map(ing => ({
            name: ing.name,
            calories: 0, // Not needed for feedback
            safe: ing.safe ?? true,
            warning: ing.warning ?? null,
        }));

        // 7. Build goal-specific coaching prompt
        const prompt = buildCoachingPrompt(
            enrichedProfile,
            todayContext,
            {
                name: report.name,
                calories: report.calories,
                macros: report.macros,
                ingredients,
            },
            mealTime,
            locale
        );

        // 8. Generate feedback with Gemini
        let feedback: string;
        try {
            const result = await model.generateContent([prompt]);
            feedback = result.response.text() || "¡Buen progreso, sigue así!";

            // Clean up any extra formatting
            feedback = feedback.trim();
            if (feedback.length > 420) {
                feedback = feedback.substring(0, 417) + "...";
            }
        } catch {
            const fallbackMsg = locale === "en"
                ? `Great job, ${enrichedProfile.name}! Keep it up 💪`
                : `¡Buen trabajo, ${enrichedProfile.name}! Sigue así 💪`;
            feedback = fallbackMsg;
        }

        // 9. Calculate remaining values for context
        const caloriesAfterMeal = todayContext.caloriesConsumed + report.calories;
        const caloriesRemaining = Math.max(0, enrichedProfile.dailyCalorieTarget - caloriesAfterMeal);
        const proteinAfterMeal = todayContext.proteinConsumed + report.macros.protein;
        const proteinRemaining = Math.max(0, enrichedProfile.dailyProteinTarget - proteinAfterMeal);
        const dailyProgress = Math.min(100, Math.round((caloriesAfterMeal / enrichedProfile.dailyCalorieTarget) * 100));

        return NextResponse.json(
            {
                success: true,
                data: {
                    feedback,
                    context: {
                        caloriesRemaining,
                        proteinRemaining,
                        dailyProgress,
                    },
                },
            },
            { status: 200 }
        );
    } catch (error) {
        return errorHandler(error, { route: "/api/meals/feedback" }) as NextResponse<
            ApiResponse<FeedbackResponse>
        >;
    }
}
