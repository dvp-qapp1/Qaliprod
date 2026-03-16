import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { errorHandler, ApiError } from "@/lib/errors/handler";
import { z } from "zod";

const pantrySaveSchema = z.object({
    ingredients: z.array(z.object({
        name: z.string(),
        quantity: z.number().nullable(),
        unit: z.string().nullable(),
        category: z.string().optional(),
    })),
});

/**
 * GET /api/meals/pantry
 * Fetch all pantry items for the current user.
 */
export async function GET() {
    try {
        const { user, error: authError } = await getUser();
        if (authError || !user) throw new ApiError(401, "Unauthorized");

        const supabase = await createClient();

        // 1. Get profile.id
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (profileError || !profile) {
            throw new ApiError(404, "Profile not found");
        }

        // 2. Fetch pantry items with ingredient details
        const { data, error: pantryError } = await supabase
            .from("pantry_items")
            .select(`
                id,
                quantity,
                unit,
                last_updated,
                ingredients (
                    name,
                    category
                )
            `)
            .eq("user_id", profile.id)
            .order("last_updated", { ascending: false });

        if (pantryError) throw pantryError;

        // 3. Format response
        const items = (data || []).map((item: any) => ({
            id: item.id,
            name: item.ingredients.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.ingredients.category,
            lastUpdated: item.last_updated,
        }));

        return NextResponse.json({ success: true, data: items });

    } catch (error) {
        return errorHandler(error, { route: "/api/meals/pantry", method: "GET" });
    }
}

/**
 * POST /api/meals/pantry
 * Upsert pantry items for the current user.
 */
export async function POST(request: NextRequest) {
    try {
        const { user, error: authError } = await getUser();
        if (authError || !user) throw new ApiError(401, "Unauthorized");

        const body = await request.json();
        const { ingredients } = pantrySaveSchema.parse(body);

        const supabase = await createClient();

        // 1. Get profile.id (internal ID used as FK in pantry_items)
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (profileError || !profile) {
            throw new ApiError(404, "Profile not found");
        }

        for (const item of ingredients) {
            try {
                // 2. Get or create ingredient
                const ingredientUpsert: any = { name: item.name };
                if (item.category) ingredientUpsert.category = item.category;

                const { data: ingData, error: ingError } = await supabase
                    .from("ingredients")
                    .upsert(ingredientUpsert, { onConflict: "name" })
                    .select()
                    .single();

                if (ingError) {
                    console.error(`Error saving ingredient ${item.name}:`, ingError);
                    continue; // Skip failed ingredient but try others
                }

                if (!ingData) {
                    console.error(`No data returned from upsert for ${item.name}`);
                    continue;
                }

                // 3. Upsert pantry item
                const { error: pantryError } = await supabase
                    .from("pantry_items")
                    .upsert({
                        user_id: profile.id,
                        ingredient_id: ingData.id,
                        quantity: item.quantity,
                        unit: item.unit,
                        last_updated: new Date().toISOString(),
                    }, { onConflict: "user_id,ingredient_id" });

                if (pantryError) {
                    console.error(`Error saving pantry item for ${item.name}:`, pantryError);
                }
            } catch (innerError) {
                console.error(`Unexpected error for ${item.name}:`, innerError);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return errorHandler(error, { route: "/api/meals/pantry" });
    }
}
