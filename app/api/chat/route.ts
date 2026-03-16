import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGenAI } from "@/lib/gemini/client";
import { mealRepository } from "@/repositories/mealRepository";
import { profileRepository } from "@/repositories/profileRepository";
import { buildKiliContext, buildKiliSystemPrompt } from "@/lib/prompts/kili-coach";
import { sanitizeInput, guardMessage, validateOutput, ChatGuardError } from "@/lib/prompts/guard";
import { locales, defaultLocale, type Locale } from "@/modules/cores/i18n/src/config/locales";

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const { message, history, timezoneOffset, locale: localeParam, recipe } = await request.json();

        // Validate locale, fallback to default
        const locale: Locale = locales.includes(localeParam as Locale)
            ? (localeParam as Locale)
            : defaultLocale;

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Mensaje requerido" },
                { status: 400 }
            );
        }

        // ═══════════════════════════════════════════════════════════════════
        // LAYER 1: Input Sanitization
        // ═══════════════════════════════════════════════════════════════════
        let sanitizedMessage: string;
        try {
            sanitizedMessage = sanitizeInput(message);
        } catch (err) {
            if (err instanceof ChatGuardError) {
                return NextResponse.json(
                    { error: err.message },
                    { status: 400 }
                );
            }
            throw err;
        }

        // ═══════════════════════════════════════════════════════════════════
        // LAYER 2: Topic Fencing & Injection Detection
        // ═══════════════════════════════════════════════════════════════════
        const guard = guardMessage(sanitizedMessage, locale);
        if (!guard.allowed) {
            // Return deflection as if Kili responded — no AI call needed
            return NextResponse.json({
                message: guard.deflection,
                success: true,
            });
        }

        // Chef mode context if recipe is provided
        const chefContext = recipe ? (
            locale === "es"
                ? `\n\n🍳 **MODO CHEF ACTIVADO** - El usuario está cocinando esta receta:\n` +
                `- Título: ${recipe.title}\n` +
                `- Calorías: ${recipe.calories} kcal\n` +
                `- Ingredientes: ${recipe.ingredients?.join(", ") || "No especificados"}\n` +
                `- Instrucciones: ${recipe.instructions?.join(" → ") || "No especificadas"}\n\n` +
                `Actúa como un chef amigable. Guía paso a paso, sugiere sustitutos de ingredientes si preguntan, y da tips de cocina prácticos.`
                : `\n\n🍳 **CHEF MODE ACTIVE** - The user is cooking this recipe:\n` +
                `- Title: ${recipe.title}\n` +
                `- Calories: ${recipe.calories} kcal\n` +
                `- Ingredients: ${recipe.ingredients?.join(", ") || "Not specified"}\n` +
                `- Instructions: ${recipe.instructions?.join(" → ") || "Not specified"}\n\n` +
                `Act as a friendly chef. Guide step by step, suggest ingredient substitutes if asked, and give practical cooking tips.`
        ) : "";

        // ═══════════════════════════════════════════════════════════════════
        // LOAD COMPLETE USER CONTEXT
        // ═══════════════════════════════════════════════════════════════════

        // Get date range for week summary (last 7 days)
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // User's timezone offset in minutes from getTimezoneOffset() (e.g., +300 for UTC-5)
        // If not provided, functions will fall back to server time
        const tzOffset = typeof timezoneOffset === "number" ? timezoneOffset : undefined;

        // First get the profile to get the correct ID for meal queries
        const profile = await profileRepository.findByUserId(user.id);

        if (!profile) {
            return NextResponse.json(
                { error: "Perfil no encontrado. Por favor completa tu perfil primero." },
                { status: 404 }
            );
        }

        // IMPORTANT: Meals are stored with profile.id, not auth user.id
        const profileId = profile.id;

        // Fetch meal context in parallel for performance
        const [todayMeals, dailyCalories, weekMeals, pantryData, recipesData] = await Promise.all([
            mealRepository.findTodaysMeals(profileId, tzOffset),
            mealRepository.getDailyCalories(profileId, today, tzOffset),
            mealRepository.findAll({
                userId: profileId,
                startDate: weekAgo,
                endDate: today,
                limit: 50,
            }),
            supabase
                .from("pantry_items")
                .select("id, quantity, unit, ingredients(name, category)")
                .eq("user_id", profileId),
            supabase
                .from("generated_recipes")
                .select("id, title, ingredients, description")
                .eq("user_id", profileId)
                .order("created_at", { ascending: false })
                .limit(10),
        ]);

        // Build complete context for Kili (with locale)
        const kiliContext = buildKiliContext(
            profile,
            todayMeals,
            weekMeals,
            dailyCalories,
            pantryData.data || [],
            recipesData.data || [],
            locale
        );

        // Build personalized system prompt with full context + chef mode if applicable
        const systemPrompt = buildKiliSystemPrompt(kiliContext) + chefContext;

        // ═══════════════════════════════════════════════════════════════════
        // GEMINI CHAT
        // ═══════════════════════════════════════════════════════════════════

        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // Convert history to Gemini format
        const chatHistory = (history || []).map((msg: { role: string; content: string }) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));

        // Start chat with system prompt injected (bilingual greeting)
        const greeting = locale === "es"
            ? `¡Hola, ${kiliContext.profile.name}! 👋 Estoy aquí para ayudarte. ¿En qué puedo orientarte hoy?`
            : `Hi, ${kiliContext.profile.name}! 👋 I'm here to help you. What can I assist you with today?`;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: greeting }] },
                ...chatHistory,
            ],
        });

        // Send message and get response
        const result = await chat.sendMessage(sanitizedMessage);
        const rawResponse = result.response.text();

        // ═══════════════════════════════════════════════════════════════════
        // LAYER 3: Output Validation
        // ═══════════════════════════════════════════════════════════════════
        const response = validateOutput(rawResponse, locale);

        // Save message to database (optional, ignore errors if table doesn't exist)
        try {
            await supabase.from("chat_messages").insert([
                { user_id: user.id, role: "user", content: sanitizedMessage },
                { user_id: user.id, role: "assistant", content: response },
            ]);
        } catch {
            // Silently fail if table doesn't exist
        }

        return NextResponse.json({
            message: response,
            success: true,
        });
    } catch (error) {
        console.error("Chat API error:", error);

        return NextResponse.json(
            { error: "Error al procesar el mensaje. Intenta de nuevo." },
            { status: 500 }
        );
    }
}
