import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiService } from "@/services/geminiService";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { ingredientNames, locale = "es" } = body as {
            ingredientNames: string[];
            locale?: "es" | "en";
        };

        if (!ingredientNames || !Array.isArray(ingredientNames) || ingredientNames.length === 0) {
            return NextResponse.json(
                { error: "ingredientNames array is required" },
                { status: 400 }
            );
        }

        // Get user profile for personalized recipes
        const { data: profile } = await supabase
            .from("profiles")
            .select("id, goal, diet_style")
            .eq("user_id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        // Generate recipes using Gemini AI
        const recipes = await geminiService.suggestRecipesFromPantry(
            ingredientNames,
            {
                goal: profile?.goal,
                diet_style: profile?.diet_style,
            },
            locale
        );

        // Save generated recipes to database for history
        if (recipes.length > 0) {
            const recipesToInsert = recipes.map((recipe) => ({
                user_id: profile.id, // Reference to profiles.id (UUID)
                title: recipe.title,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                calories: recipe.calories,
                image_url: recipe.image,
                description: recipe.description,
                source_ingredients: ingredientNames,
            }));

            const { error: insertError } = await supabase
                .from("generated_recipes")
                .insert(recipesToInsert);

            if (insertError) {
                console.error("Error saving recipes to database:", insertError);
                // We return the recipes anyway so the user doesn't lose them UI-wise
            }
        }

        return NextResponse.json({
            success: true,
            recipes
        });
    } catch (error) {
        console.error("Recipe generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate recipes" },
            { status: 500 }
        );
    }
}
