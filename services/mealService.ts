import { mealRepository, type CreateMealData } from "@/repositories/mealRepository";
import { geminiService } from "@/services/geminiService";
import type { Meal, AnalyzedMeal, DailyCalories, SubscriptionTier } from "@/types/api.types";

/**
 * Service for meal business logic.
 */
export const mealService = {
    /**
     * Analyze a food image and save the meal.
     */
    async analyzeAndSave(
        imageBase64: string,
        userId: string, // Profile ID
        authUserId: string, // Auth user ID for rate limiting
        tier: SubscriptionTier = "free",
        imageUrl?: string
    ): Promise<AnalyzedMeal> {
        // 1. Analyze with AI
        const analysis = await geminiService.analyzeFoodImage(
            imageBase64,
            authUserId,
            tier
        );

        // 2. Determine safety status based on calories
        const safetyStatus = this.calculateSafetyStatus(analysis.calories);

        // 3. Save to database
        const mealData: CreateMealData = {
            user_id: userId,
            name: analysis.name,
            calories: analysis.calories,
            protein: analysis.protein,
            carbs: analysis.carbs,
            fat: analysis.fat,
            ingredients: analysis.ingredients,
            safety_status: safetyStatus,
            image_url: imageUrl,
            meal_time: new Date().toISOString(),
        };

        const meal = await mealRepository.create(mealData);

        return {
            ...meal,
            suggestions: analysis.suggestions,
        };
    },

    /**
     * Analyze a text description and save the meal.
     */
    async analyzeTextAndSave(
        description: string,
        userId: string, // Profile ID
        authUserId: string, // Auth user ID for rate limiting
        tier: SubscriptionTier = "free",
        userAllergies: string[] = [],
        dietStyle?: string
    ): Promise<AnalyzedMeal & { isFood: boolean }> {
        // 1. Analyze with AI
        const analysis = await geminiService.analyzeMealText(
            description,
            authUserId,
            tier,
            userAllergies,
            dietStyle
        );

        // 2. Check if it's actually food
        if (!analysis.isFood) {
            return {
                id: "",
                user_id: userId,
                name: "",
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                ingredients: [],
                safety_status: "safe",
                meal_time: new Date().toISOString(),
                created_at: new Date().toISOString(),
                suggestions: [],
                isFood: false,
            };
        }

        // 3. Determine safety status
        const safetyStatus = this.calculateSafetyStatus(analysis.calories);

        // 4. Save to database
        const mealData: CreateMealData = {
            user_id: userId,
            name: analysis.name,
            calories: analysis.calories,
            protein: analysis.protein,
            carbs: analysis.carbs,
            fat: analysis.fat,
            ingredients: analysis.ingredients,
            safety_status: safetyStatus,
            meal_time: new Date().toISOString(),
        };

        const meal = await mealRepository.create(mealData);

        return {
            ...meal,
            suggestions: analysis.suggestions,
            isFood: true,
        };
    },

    /**
     * Get meal history for a user.
     */
    async getMealHistory(
        userId: string,
        days: number = 7,
        limit: number = 50
    ): Promise<Meal[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        return mealRepository.findAll({
            userId,
            startDate,
            limit,
        });
    },

    /**
     * Get today's meals for a user.
     */
    async getTodaysMeals(userId: string): Promise<Meal[]> {
        return mealRepository.findTodaysMeals(userId);
    },

    /**
     * Get today's summary.
     */
    async getTodaysSummary(userId: string): Promise<{
        meals: Meal[];
        totals: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            mealsCount: number;
        };
    }> {
        const meals = await mealRepository.findTodaysMeals(userId);

        const totals = meals.reduce(
            (acc, meal) => ({
                calories: acc.calories + meal.calories,
                protein: acc.protein + meal.protein,
                carbs: acc.carbs + meal.carbs,
                fat: acc.fat + meal.fat,
                mealsCount: acc.mealsCount + 1,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0, mealsCount: 0 }
        );

        return { meals, totals };
    },

    /**
     * Get weekly analytics.
     */
    async getWeeklyAnalytics(userId: string): Promise<DailyCalories[]> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        return mealRepository.getDailyCaloriesRange(userId, startDate, endDate);
    },

    /**
     * Delete a meal.
     */
    async deleteMeal(mealId: string, userId: string): Promise<void> {
        // Verify ownership
        const meal = await mealRepository.findById(mealId);
        if (!meal) {
            throw new Error("Meal not found");
        }
        if (meal.user_id !== userId) {
            throw new Error("Unauthorized");
        }

        await mealRepository.delete(mealId);
    },

    /**
     * Calculate safety status based on calories.
     */
    calculateSafetyStatus(calories: number): "safe" | "warning" | "danger" {
        if (calories <= 500) {
            return "safe";
        } else if (calories <= 800) {
            return "warning";
        } else {
            return "danger";
        }
    },
};
