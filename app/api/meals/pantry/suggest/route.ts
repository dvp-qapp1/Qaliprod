import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { profileRepository } from "@/repositories/profileRepository";
import { geminiService } from "@/services/geminiService";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import { locales, defaultLocale, type Locale } from "@/modules/cores/i18n/src/config/locales";

const MAX_REFRESHES_PER_DAY = 5;

/**
 * GET /api/meals/pantry/suggest
 * Suggest recipes based on the user's current pantry.
 * 
 * Persistence logic:
 * 1. Check if user has a recipe for TODAY
 * 2. If exists and no refresh requested → return it
 * 3. If refresh requested → verify refresh_count < 5
 * 4. Generate new recipe, store in DB, increment refresh_count
 * 
 * Query params:
 * - locale: "es" | "en"
 * - refresh: "true" to force regeneration (max 5/day)
 */
export async function GET(request: NextRequest) {
    try {
        const { user, error: authError } = await getUser();
        if (authError || !user) throw new ApiError(401, "Unauthorized");

        const supabase = await createClient();

        // 1. Get profile
        const profile = await profileRepository.findByUserId(user.id);
        if (!profile) throw new ApiError(404, "Profile not found");

        // 2. Parse query params
        const { searchParams } = new URL(request.url);
        const localeParam = searchParams.get("locale");
        const locale: Locale = locales.includes(localeParam as Locale)
            ? (localeParam as Locale)
            : defaultLocale;
        const requestRefresh = searchParams.get("refresh") === "true";

        // 3. Check for existing recipe TODAY (graceful fallback if table doesn't exist)
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        let existingRecipe: any = null;
        let tableExists = true;

        const { data, error: fetchError } = await supabase
            .from("suggested_recipes")
            .select("*")
            .eq("user_id", profile.id)
            .eq("generated_date", today)
            .maybeSingle();

        if (fetchError) {
            // Table doesn't exist yet (42P01) - graceful fallback
            if (fetchError.code === "42P01" || fetchError.message?.includes("does not exist")) {
                console.log("suggested_recipes table not found, using fallback mode");
                tableExists = false;
            } else if (fetchError.code !== "PGRST116") {
                console.error("Error fetching suggested recipe:", fetchError);
            }
        } else {
            existingRecipe = data;
        }

        // 4. If exists and no refresh → return cached recipe
        if (existingRecipe && !requestRefresh) {
            return NextResponse.json({
                success: true,
                data: [{
                    id: String(existingRecipe.id),
                    title: existingRecipe.title,
                    image: existingRecipe.image,
                    calories: existingRecipe.calories,
                    ingredients: existingRecipe.ingredients || [],
                    instructions: existingRecipe.instructions || [],
                    image_description: existingRecipe.image_description
                }],
                meta: {
                    refresh_count: existingRecipe.refresh_count,
                    max_refreshes: MAX_REFRESHES_PER_DAY,
                    can_refresh: existingRecipe.refresh_count < MAX_REFRESHES_PER_DAY
                }
            });
        }

        // 5. Check refresh limit
        if (existingRecipe && requestRefresh && existingRecipe.refresh_count >= MAX_REFRESHES_PER_DAY) {
            return NextResponse.json({
                success: false,
                error: locale === "es"
                    ? "Has alcanzado el límite de 5 actualizaciones por día"
                    : "You have reached the limit of 5 refreshes per day",
                meta: {
                    refresh_count: existingRecipe.refresh_count,
                    max_refreshes: MAX_REFRESHES_PER_DAY,
                    can_refresh: false
                }
            }, { status: 429 });
        }

        // 6. Get pantry items for recipe generation
        const { data: pantryData, error: pantryError } = await supabase
            .from("pantry_items")
            .select("ingredients(name)")
            .eq("user_id", profile.id);

        if (pantryError) throw pantryError;

        const pantryItems = pantryData?.map((item: any) => item.ingredients.name) || [];

        if (pantryItems.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                meta: {
                    refresh_count: existingRecipe?.refresh_count || 0,
                    max_refreshes: MAX_REFRESHES_PER_DAY,
                    can_refresh: true
                }
            });
        }

        // 7. Generate new recipe via AI
        const recipes = await geminiService.suggestRecipesFromPantry(
            pantryItems,
            { goal: profile.goal || undefined, diet_style: profile.diet_style || undefined },
            locale
        );

        if (!recipes || recipes.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                meta: {
                    refresh_count: existingRecipe?.refresh_count || 0,
                    max_refreshes: MAX_REFRESHES_PER_DAY,
                    can_refresh: true
                }
            });
        }

        const newRecipe = recipes[0]; // Take first suggestion
        const newRefreshCount = (existingRecipe?.refresh_count || 0) + (requestRefresh ? 1 : 0);

        // 8. Upsert recipe to DB (only if table exists)
        if (tableExists) {
            if (existingRecipe) {
                // Update existing
                const { error: updateError } = await supabase
                    .from("suggested_recipes")
                    .update({
                        title: newRecipe.title,
                        image: newRecipe.image,
                        calories: newRecipe.calories,
                        ingredients: newRecipe.ingredients,
                        instructions: newRecipe.instructions,
                        image_description: newRecipe.image_description,
                        refresh_count: newRefreshCount,
                        generated_at: new Date().toISOString()
                    })
                    .eq("id", existingRecipe.id);

                if (updateError) {
                    console.error("Error updating suggested recipe:", updateError);
                }
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from("suggested_recipes")
                    .insert({
                        user_id: profile.id,
                        title: newRecipe.title,
                        image: newRecipe.image,
                        calories: newRecipe.calories,
                        ingredients: newRecipe.ingredients,
                        instructions: newRecipe.instructions,
                        image_description: newRecipe.image_description,
                        refresh_count: 0
                    });

                if (insertError) {
                    console.error("Error inserting suggested recipe:", insertError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: [{
                id: newRecipe.id || crypto.randomUUID(),
                title: newRecipe.title,
                image: newRecipe.image,
                calories: newRecipe.calories,
                ingredients: newRecipe.ingredients || [],
                instructions: newRecipe.instructions || [],
                image_description: newRecipe.image_description
            }],
            meta: {
                refresh_count: newRefreshCount,
                max_refreshes: MAX_REFRESHES_PER_DAY,
                can_refresh: newRefreshCount < MAX_REFRESHES_PER_DAY
            }
        });

    } catch (error) {
        return errorHandler(error, { route: "/api/meals/pantry/suggest" });
    }
}
