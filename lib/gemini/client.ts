import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { env } from "@/env";

/**
 * CRITICAL: Prevent client-side import.
 * This check ensures the Gemini API key is never exposed to the browser.
 */
if (typeof window !== "undefined") {
    throw new Error(
        "Gemini client cannot be imported on client side. " +
        "This would expose your API key. Use API routes instead."
    );
}

let _genAI: GoogleGenerativeAI | null = null;
let _model: GenerativeModel | null = null;

/**
 * Get the Gemini AI client instance.
 * Lazy-loaded to avoid build-time errors when API key is not set.
 */
export function getGenAI(): GoogleGenerativeAI {
    if (!_genAI) {
        if (!env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not defined in environment variables");
        }
        _genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
    return _genAI;
}

/**
 * Get the Gemini 2.0 Flash model for fast image analysis.
 * Lazy-loaded to avoid build-time errors when API key is not set.
 */
export function getModel(): GenerativeModel {
    if (!_model) {
        _model = getGenAI().getGenerativeModel({
            model: "gemini-3-flash-preview",
        });
    }
    return _model;
}

let _imageModel: GenerativeModel | null = null;

/**
 * Get the Imagen model for AI image generation.
 * Uses gemini-3-flash-preview with image generation capability.
 */
export function getImageModel(): GenerativeModel {
    if (!_imageModel) {
        _imageModel = getGenAI().getGenerativeModel({
            model: "gemini-3-flash-preview",
        });
    }
    return _imageModel;
}

// Re-export for backwards compatibility (will throw if API key missing)
export const model = {
    generateContent: async (...args: Parameters<GenerativeModel["generateContent"]>) => {
        return getModel().generateContent(...args);
    },
};
