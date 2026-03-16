import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { profileRepository } from "@/repositories/profileRepository";
import { geminiService } from "@/services/geminiService";
import { analyzeSchema } from "@/lib/validations/meal.schema";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import type { ApiResponse } from "@/types/api.types";
import { locales, defaultLocale, type Locale } from "@/modules/cores/i18n/src/config/locales";

// Type for preview response compatibility with ScannerTab
interface PantryPreviewResponse {
    isFood: boolean;
    name: string;
    ingredients: Array<{
        name: string;
        safe: boolean;
        calories: number;
        quantity?: number;
        category?: string;
    }>;
    calories: number;
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    safetyStatus: "safe";
}

/**
 * POST /api/meals/analyze-pantry
 * Analyze a pantry image OR text description.
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<ApiResponse<PantryPreviewResponse>>> {
    try {
        // 1. Authenticate user
        const { user, error: authError } = await getUser();
        if (authError || !user) {
            throw new ApiError(401, "Unauthorized");
        }

        // 2. Get profile
        const profile = await profileRepository.findByUserId(user.id);
        if (!profile) {
            throw new ApiError(404, "Profile not found");
        }

        // 3. Validate request
        const body = await request.json();
        const validated = analyzeSchema.parse(body);

        const localeParam = (body as { locale?: string }).locale;
        const locale: Locale = locales.includes(localeParam as Locale)
            ? (localeParam as Locale)
            : defaultLocale;

        let result: PantryPreviewResponse;

        // 4. Analyze
        if (validated.imageBase64) {
            const analysis = await geminiService.analyzePantryImage(
                validated.imageBase64,
                user.id,
                profile.subscription_tier,
                locale
            );

            result = {
                isFood: analysis.isFood,
                name: "Alacena Detectada",
                ingredients: analysis.ingredients.map(ing => ({
                    name: ing.name,
                    safe: true,
                    calories: 0, // Calories not needed for pantry items in this view
                    quantity: ing.quantity,
                    unit: ing.unit,
                    category: ing.category,
                })),
                calories: 0,
                macros: { protein: 0, carbs: 0, fat: 0 },
                safetyStatus: "safe",
            };
        } else if (validated.description) {
            const analysis = await geminiService.analyzePantryText(
                validated.description,
                user.id,
                profile.subscription_tier,
                locale
            );

            result = {
                isFood: analysis.isFood,
                name: "Alacena Detectada",
                ingredients: analysis.ingredients.map(ing => ({
                    name: ing.name,
                    safe: true,
                    calories: 0,
                    quantity: ing.quantity,
                    unit: ing.unit,
                    category: ing.category,
                })),
                calories: 0,
                macros: { protein: 0, carbs: 0, fat: 0 },
                safetyStatus: "safe",
            };
        } else {
            throw new ApiError(400, "Body missing input");
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        return errorHandler(error, { route: "/api/meals/analyze-pantry" }) as NextResponse<
            ApiResponse<PantryPreviewResponse>
        >;
    }
}
