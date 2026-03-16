import { z } from "zod";

// Analyze Request - can be either image or text description
export const analyzeSchema = z.object({
    imageBase64: z
        .string()
        .min(1, "Image is required")
        .refine((val) => val.length < 10_000_000, "Image too large (max 10MB)")
        .optional(),
    description: z
        .string()
        .min(3, "Description too short")
        .max(500, "Description too long")
        .optional(),
    portionSize: z
        .enum(["small", "medium", "large", "extra_large"])
        .default("medium"),
}).refine(
    (data) => data.imageBase64 || data.description,
    "Either imageBase64 or description is required"
);

export type AnalyzeInput = z.infer<typeof analyzeSchema>;

// Legacy schema for backwards compatibility
export const analyzeImageSchema = analyzeSchema;
export type AnalyzeImageInput = AnalyzeInput;

// Create Meal Request
export const createMealSchema = z.object({
    name: z.string().min(1, "Name is required").max(200),
    calories: z.number().min(0).max(10000),
    protein: z.number().min(0).max(1000),
    carbs: z.number().min(0).max(1000),
    fat: z.number().min(0).max(1000),
    ingredients: z.array(z.string()).default([]),
    mealTime: z.string().datetime(),
});

export type CreateMealInput = z.infer<typeof createMealSchema>;

// Update Profile Request
export const updateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    age: z.number().int().min(1).max(150).optional(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    height_cm: z.number().min(50).max(300).optional(),
    weight_kg: z.number().min(20).max(500).optional(),
    goal: z
        .enum(["lose_weight", "gain_muscle", "maintain", "eat_healthy"])
        .optional(),
    activity_level: z
        .enum(["sedentary", "light", "moderate", "active", "very_active"])
        .optional(),
    target_calories: z.number().int().min(500).max(10000).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Query Parameters
export const mealQuerySchema = z.object({
    days: z.coerce.number().int().min(1).max(365).default(7),
    limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type MealQueryInput = z.infer<typeof mealQuerySchema>;
