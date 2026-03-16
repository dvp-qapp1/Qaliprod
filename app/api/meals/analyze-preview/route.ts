import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { profileRepository } from "@/repositories/profileRepository";
import { geminiService } from "@/services/geminiService";
import { analyzeSchema } from "@/lib/validations/meal.schema";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import type { ApiResponse, PortionEstimate } from "@/types/api.types";
import { locales, defaultLocale, type Locale } from "@/modules/cores/i18n/src/config/locales";

// Type for preview response (no saving)
interface MealPreviewResponse {
    isFood: boolean;
    name: string;
    ingredients: Array<{
        name: string;
        safe: boolean;
        calories: number;
        grams?: number;
        alert?: string;
    }>;
    calories: number;
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    safetyStatus: "safe" | "warning" | "danger";
    safetyReasoning?: string;
    portionEstimate?: PortionEstimate;
}

/**
 * POST /api/meals/analyze-preview
 * Analyze a food image OR text description - returns analysis WITHOUT saving.
 * This is used for the edit/confirm flow before the user saves.
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<MealPreviewResponse>>> {
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

        // Extract and validate locale
        const localeParam = (body as { locale?: string }).locale;
        const locale: Locale = locales.includes(localeParam as Locale)
            ? (localeParam as Locale)
            : defaultLocale;

        let result: MealPreviewResponse;

        // 4. Analyze based on input type
        if (validated.imageBase64) {
            // Image analysis - now with full safety evaluation and portion estimation
            const analysis = await geminiService.analyzeFoodImage(
                validated.imageBase64,
                user.id,
                profile.subscription_tier,
                profile.allergies || [],
                profile.diet_style,
                validated.portionSize,
                locale
            );

            // Check if it's food
            if (!analysis.isFood) {
                result = {
                    isFood: false,
                    name: "",
                    ingredients: [],
                    calories: 0,
                    macros: { protein: 0, carbs: 0, fat: 0 },
                    safetyStatus: "safe",
                };
            } else {
                // Use detailedIngredients for safety info
                result = {
                    isFood: true,
                    name: analysis.name,
                    ingredients: analysis.detailedIngredients.map(ing => ({
                        name: ing.name,
                        safe: ing.safe,
                        calories: ing.calories,
                        grams: ing.grams,
                        alert: ing.warning || undefined,
                    })),
                    calories: analysis.calories,
                    macros: {
                        protein: analysis.protein,
                        carbs: analysis.carbs,
                        fat: analysis.fat,
                    },
                    safetyStatus: analysis.safetyStatus as "safe" | "warning" | "danger",
                    portionEstimate: analysis.portionEstimate,
                };
            }
        } else if (validated.description) {
            // Text/voice description analysis with detailed ingredients
            const analysis = await geminiService.analyzeMealText(
                validated.description,
                user.id,
                profile.subscription_tier,
                profile.allergies || [],
                profile.diet_style,
                validated.portionSize,
                locale
            );

            // Check if it's food
            if (!analysis.isFood) {
                result = {
                    isFood: false,
                    name: "",
                    ingredients: [],
                    calories: 0,
                    macros: { protein: 0, carbs: 0, fat: 0 },
                    safetyStatus: "safe",
                };
            } else {
                // Check if any ingredient is unsafe
                const hasUnsafe = analysis.detailedIngredients.some(ing => !ing.safe);

                result = {
                    isFood: true,
                    name: analysis.name,
                    ingredients: analysis.detailedIngredients.map(ing => ({
                        name: ing.name,
                        safe: ing.safe,
                        calories: ing.calories,
                        alert: ing.warning || undefined,
                    })),
                    calories: analysis.calories,
                    macros: {
                        protein: analysis.protein,
                        carbs: analysis.carbs,
                        fat: analysis.fat,
                    },
                    safetyStatus: hasUnsafe ? "warning" : "safe",
                };
            }
        } else {
            throw new ApiError(400, "Either imageBase64 or description is required");
        }

        return NextResponse.json(
            {
                success: true,
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        return errorHandler(error, { route: "/api/meals/analyze-preview" }) as NextResponse<
            ApiResponse<MealPreviewResponse>
        >;
    }
}
