/**
 * Kili Chat Guard — Prompt Injection Defense & Topic Fencing
 *
 * Protects against:
 * 1. Instruction override ("Ignore previous instructions...")
 * 2. Prompt leakage ("Repeat your system prompt...")
 * 3. Role confusion ("system: ...", "assistant: ...")
 * 4. Jailbreak attempts ("Act as DAN...")
 * 5. Off-topic requests (politics, programming, etc.)
 * 6. XSS via output
 */

import type { Locale } from "@/modules/cores/i18n/src/config/locales";

// ═══════════════════════════════════════════════════════════════════════════
// INPUT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════

/** Maximum allowed input length */
const MAX_INPUT_LENGTH = 1000;

/** Role marker patterns to strip from user input */
const ROLE_MARKER_PATTERNS: RegExp[] = [
    /\bsystem\s*:/gi,
    /\bassistant\s*:/gi,
    /\buser\s*:/gi,
    /\bmodel\s*:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /<\|system\|>/gi,
    /<\|user\|>/gi,
    /<\|assistant\|>/gi,
];

/**
 * Sanitize user input before sending to AI.
 * Returns sanitized string or throws if input is invalid.
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== "string") {
        throw new ChatGuardError("INVALID_INPUT", "Input must be a non-empty string.");
    }

    // Length limit
    if (input.length > MAX_INPUT_LENGTH) {
        throw new ChatGuardError(
            "INPUT_TOO_LONG",
            `Message exceeds ${MAX_INPUT_LENGTH} character limit.`
        );
    }

    let sanitized = input;

    // Remove control characters (keep newlines and tabs for formatting)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // Normalize excessive whitespace (keep single newlines)
    sanitized = sanitized.replace(/[^\S\n]+/g, " ");
    sanitized = sanitized.replace(/\n{3,}/g, "\n\n");
    sanitized = sanitized.trim();

    // Strip role markers that could confuse message boundaries
    for (const pattern of ROLE_MARKER_PATTERNS) {
        sanitized = sanitized.replace(pattern, "");
    }

    return sanitized;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOPIC FENCING — Detect off-topic messages
// ═══════════════════════════════════════════════════════════════════════════

/** Patterns that indicate injection attempts */
const INJECTION_PATTERNS: RegExp[] = [
    // Instruction override
    /ignor(a|e)\s*(todas?\s*)?(las\s*)?(instrucciones|reglas|directivas)/i,
    /ignore\s*(all\s*)?(previous\s*)?(instructions|rules|directives)/i,
    /olvida\s*(todas?\s*)?(las\s*)?(instrucciones|reglas)/i,
    /forget\s*(all\s*)?(previous\s*)?(instructions|rules)/i,
    /nuevas?\s*instrucciones/i,
    /new\s*instructions/i,
    /disregard\s*(all\s*)?(prior|previous)/i,
    /override\s*(all\s*)?(rules|instructions|system)/i,

    // Prompt leakage
    /repite\s*(las|tus)?\s*instrucciones/i,
    /repeat\s*(your|the)\s*instructions/i,
    /mu[ée]strame\s*(tu|el)\s*(prompt|system)/i,
    /show\s*(me\s*)?(your|the)\s*(system\s*)?prompt/i,
    /what\s*(are|were)\s*(your|the)\s*instructions/i,
    /cu[aá]les\s*son\s*tus\s*instrucciones/i,
    /reveal\s*(your|the)\s*(system|hidden)/i,

    // Jailbreak
    /act[uú]a\s*como\s*DAN/i,
    /act\s*as\s*DAN/i,
    /do\s*anything\s*now/i,
    /pretend\s*(you\s*)?have\s*no\s*restrictions/i,
    /finge\s*que\s*no\s*tienes\s*restricciones/i,
    /bypass\s*(all\s*)?(restrictions|safety|filters)/i,
    /modo\s*(sin\s*restricciones|libre|debug|desarrollador)/i,
    /developer\s*mode/i,
    /debug\s*mode/i,
    /jailbreak/i,
];

/** Off-topic patterns — things Kili should NOT help with */
const OFF_TOPIC_PATTERNS: RegExp[] = [
    // Politics
    /\b(presidente|pol[ií]tic[oa]s?|gobierno|elecciones|partido\s*pol[ií]tico)\b/i,
    /\b(president|politic(?:s|al|ian)|government|election|political\s*party)\b/i,

    // Programming / tech
    /\b(programaci[oó]n|c[oó]digo|javascript|python|react|html|css|sql|api|backend|frontend|bug|deploy)\b/i,
    /\b(programming|coding|code\s*review|software|algorithm|database|server|debug)\b/i,

    // General knowledge unrelated to nutrition
    /\b(capital\s+de|capital\s+of|cu[aá]ntos?\s*(a[nñ]os?|habitantes))\b/i,
    /\b(who\s+(is|was|invented)|when\s+(was|did)|where\s+is)\b/i,
    /\b(qui[eé]n\s+(es|fue|invent[oó])|cu[aá]ndo\s+(fue|se)|d[oó]nde\s+(est[aá]|queda))\b/i,

    // Math / homework
    /\b(resuelve|solve|calcula|calculate)\b.*\b(ecuaci[oó]n|equation|matem[aá]tica|math|algebra|integral)\b/i,

    // Entertainment unrelated
    /\b(pel[ií]culas?|series?\s+de\s+tv|videojuegos?|movies?|tv\s*shows?|video\s*games?)\b/i,

    // Legal / medical diagnosis (Kili coaches nutrition, not medicine)
    /\b(diagn[oó]stico|diagnosis|enfermedad|disease|medicina|medicine|tratamiento\s+m[eé]dico|medical\s+treatment)\b/i,
    /\b(abogado|lawyer|demanda|lawsuit|legal\s+advice)\b/i,
];

/**
 * Nutrition-related patterns that should ALWAYS be allowed through,
 * even if they partially match off-topic patterns.
 */
const NUTRITION_ALLOWLIST: RegExp[] = [
    /\b(calor[ií]as?|prote[ií]nas?|carbohidratos?|grasas?|fibra|vitaminas?|minerales?)\b/i,
    /\b(calories?|protein|carb(?:s|ohydrates)?|fat(?:s)?|fiber|vitamins?|minerals?)\b/i,
    /\b(comida|cena|desayuno|almuerzo|merienda|snack|receta|ingrediente|alimento)\b/i,
    /\b(meal|dinner|breakfast|lunch|snack|recipe|ingredient|food)\b/i,
    /\b(dieta|nutrici[oó]n|saludable|peso|adelgazar|engordar|m[uú]sculo)\b/i,
    /\b(diet|nutrition|healthy|weight|slim|muscle|macros)\b/i,
    /\b(cocinar|preparar|hornear|hervir|freir|asar|saltear)\b/i,
    /\b(cook|prepare|bake|boil|fry|grill|saut[eé])\b/i,
    /\b(alacena|pantry|despensa|refrigerador|fridge)\b/i,
    /\b(IMC|BMI|tdee|metabolismo|metabolism)\b/i,
];

export type GuardResult =
    | { allowed: true }
    | { allowed: false; reason: "injection" | "off_topic"; deflection: string };

/**
 * Check if a message should be allowed through to the AI.
 * Returns allowed=true or a deflection message.
 */
export function guardMessage(message: string, locale: Locale): GuardResult {
    const lower = message.toLowerCase();

    // 1. Check for injection attempts (always block)
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(message)) {
            return {
                allowed: false,
                reason: "injection",
                deflection: locale === "es"
                    ? "¡Soy Kili, tu coach nutricional! 🥗 Solo puedo ayudarte con nutrición, comidas y tu bienestar. ¿Qué te gustaría saber sobre tu alimentación?"
                    : "I'm Kili, your nutrition coach! 🥗 I can only help with nutrition, meals, and your wellness. What would you like to know about your diet?",
            };
        }
    }

    // 2. Check if message is nutrition-related (allowlist takes priority)
    const isNutritionRelated = NUTRITION_ALLOWLIST.some((p) => p.test(message));
    if (isNutritionRelated) {
        return { allowed: true };
    }

    // 3. Check for off-topic content
    for (const pattern of OFF_TOPIC_PATTERNS) {
        if (pattern.test(message)) {
            return {
                allowed: false,
                reason: "off_topic",
                deflection: locale === "es"
                    ? "¡Buena pregunta, pero eso se sale de mi especialidad! 😅 Soy Kili, experta en nutrición. Pregúntame sobre comidas, recetas, calorías, o cómo mejorar tu alimentación. ¿En qué te puedo ayudar?"
                    : "Great question, but that's outside my expertise! 😅 I'm Kili, a nutrition expert. Ask me about meals, recipes, calories, or how to improve your diet. How can I help?",
            };
        }
    }

    // 4. Allow through — the system prompt reinforcement handles edge cases
    return { allowed: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/** Keywords that suggest prompt leakage */
const LEAKAGE_KEYWORDS = [
    "system prompt",
    "mis instrucciones",
    "my instructions",
    "fui programad",
    "i was programmed",
    "directivas críticas",
    "critical directives",
    "═══════════════",
    "IDENTIDAD Y ROL",
    "IDENTITY AND ROLE",
];

/**
 * Validate AI output for security issues.
 * Returns the response or a safe fallback.
 */
export function validateOutput(output: string, locale: Locale): string {
    const lower = output.toLowerCase();

    // Check for prompt leakage
    for (const keyword of LEAKAGE_KEYWORDS) {
        if (lower.includes(keyword.toLowerCase())) {
            console.warn("[ChatGuard] Potential prompt leakage detected in output");
            return locale === "es"
                ? "¡Estoy aquí para ayudarte con tu nutrición! 🥗 ¿Qué te gustaría saber?"
                : "I'm here to help you with your nutrition! 🥗 What would you like to know?";
        }
    }

    // Strip any HTML/script tags from output (XSS prevention)
    const cleaned = output
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<\/?[a-z][^>]*>/gi, "");

    return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class ChatGuardError extends Error {
    code: string;

    constructor(code: string, message: string) {
        super(message);
        this.code = code;
        this.name = "ChatGuardError";
    }
}
