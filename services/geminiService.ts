import { model } from "@/lib/gemini/client";
import { geminiCircuitBreaker } from "@/lib/resilience/circuit-breaker";
import { checkRateLimit } from "@/lib/gemini/rate-limiter";
import { FEATURES } from "@/lib/resilience/feature-flags";
import type { MealAnalysis, PantryAnalysis, SubscriptionTier, PortionSize, PortionEstimate, DetailedIngredient, Recipe } from "@/types/api.types";
import { type Locale, defaultLocale } from "@/modules/cores/i18n/src/config/locales";

// Bilingual portion size labels
const PORTION_SIZE_LABELS: Record<Locale, Record<PortionSize, string>> = {
    es: {
        small: "pequeña/ligera (~200-300g)",
        medium: "normal/estándar (~300-450g)",
        large: "grande/abundante (~450-600g)",
        extra_large: "muy grande (~600g+)",
    },
    en: {
        small: "small/light (~200-300g)",
        medium: "normal/standard (~300-450g)",
        large: "large/generous (~450-600g)",
        extra_large: "extra large (~600g+)",
    },
};

// Bilingual prompt fragments
const PROMPTS = {
    es: {
        noKnownAllergies: "Sin alergias conocidas.",
        userAllergies: "Alergias del usuario:",
        userDiet: "Dieta del usuario:",
        respondInLanguage: "RESPONDE EN ESPAÑOL.",
        namesMustBe: "Los nombres DEBEN estar en ESPAÑOL",
        notFood: "Si la imagen NO es comida",
        namelessDish: "Plato sin nombre",
        dish: "Plato",
        noFoodDetected: "No se detectó ningún alimento en esa descripción.",
        goodProgress: "¡Buen progreso, sigue así!",
    },
    en: {
        noKnownAllergies: "No known allergies.",
        userAllergies: "User allergies:",
        userDiet: "User diet:",
        respondInLanguage: "RESPOND IN ENGLISH.",
        namesMustBe: "Names MUST be in ENGLISH",
        notFood: "If the image is NOT food",
        namelessDish: "Unnamed dish",
        dish: "Dish",
        noFoodDetected: "No food detected in that description.",
        goodProgress: "Good progress, keep it up!",
    },
};

/**
 * Service for Gemini AI food analysis.
 */
export const geminiService = {
    /**
     * Analyze a food image using Gemini Vision.
     * Uses chain-of-thought reasoning for accurate portion estimation.
     *
     * @param imageBase64 - Base64 encoded image data
     * @param userId - User ID for rate limiting
     * @param tier - User's subscription tier for rate limit calculation
     * @param userAllergies - List of user allergies
     * @param dietStyle - User's diet style (e.g., "Keto", "Vegetariana")
     * @param portionSize - User-selected portion size for better estimation
     * @param locale - Language for prompts and responses
     * @returns Analyzed meal data with nutritional information, portion estimate, and safety status
     */
    async analyzeFoodImage(
        imageBase64: string,
        userId: string,
        tier: SubscriptionTier = "free",
        userAllergies: string[] = [],
        dietStyle?: string,
        portionSize: PortionSize = "medium",
        locale: Locale = defaultLocale
    ): Promise<MealAnalysis & { isFood: boolean; detailedIngredients: DetailedIngredient[]; safetyStatus: string; portionEstimate?: PortionEstimate }> {
        // 1. Rate limit check (if enabled)
        if (FEATURES.GEMINI_RATE_LIMIT) {
            const { allowed } = await checkRateLimit(userId, tier);
            if (!allowed) {
                throw new Error("Rate limit exceeded");
            }
        }

        // 2. Execute with circuit breaker protection
        return geminiCircuitBreaker.execute(async () => {
            const p = PROMPTS[locale];
            const allergiesText = userAllergies.length > 0
                ? `${p.userAllergies} ${userAllergies.join(", ")}.`
                : p.noKnownAllergies;

            const dietText = dietStyle
                ? `${p.userDiet} ${dietStyle}.`
                : "";

            const portionLabel = PORTION_SIZE_LABELS[locale][portionSize];

            // Generate prompt based on locale
            const prompt = locale === "es"
                ? `Eres un nutricionista experto analizando una imagen de comida.

PASO 1 - IDENTIFICA LOS ALIMENTOS:
Identifica cada alimento visible en la imagen.

PASO 2 - ESTIMA EL TAMAÑO DE PORCIÓN:
El usuario indicó que esta es una porción: ${portionLabel}.
Para cada alimento, estima el peso en gramos usando:
- Referencias visuales (plato estándar ~25cm, cuchara sopera ~15g, taza ~240ml)
- Comparación con objetos comunes:
  * Puño cerrado = 1 taza = ~150g arroz/pasta cocida
  * Palma de la mano = ~85g proteína (pollo, carne, pescado)
  * Pulgar = 1 cucharada = ~15g grasa (aceite, mantequilla)
  * Tarjeta de crédito = ~85g carne muy delgada
  * Pelota de tenis = 1 fruta mediana (~150g)

PASO 3 - CALCULA CALORÍAS:
Usa: calorías = (calorías por 100g) × (gramos estimados / 100)

${allergiesText}
${dietText}

RESPONDE EN ESPAÑOL. Devuelve SOLO un objeto JSON válido:
{
  "isFood": true,
  "name": "Nombre del plato",
  "portionEstimate": {
    "totalGrams": 350,
    "confidence": "medium",
    "referenceUsed": "Plato estándar ~25cm, porción ${portionSize} indicada por usuario",
    "breakdown": [
      {"ingredient": "Arroz blanco", "grams": 200, "caloriesPer100g": 130},
      {"ingredient": "Pollo a la plancha", "grams": 150, "caloriesPer100g": 165}
    ]
  },
  "calories": 580,
  "protein": 45,
  "carbs": 25,
  "fat": 40,
  "ingredients": ["Arroz blanco", "Pollo a la plancha"],
  "detailedIngredients": [
    {"name": "Arroz blanco", "grams": 200, "calories": 260, "safe": true, "warning": null},
    {"name": "Pollo a la plancha", "grams": 150, "calories": 247, "safe": true, "warning": null}
  ],
  "suggestions": ["sugerencia1"],
  "safetyStatus": "safe"
}

NIVELES DE CONFIANZA:
- high: Referencias claras visibles (utensilios, objetos conocidos, plato completo)
- medium: Estimación razonable basada en el tamaño indicado
- low: Imagen ambigua, sin contexto de escala

EVALUACIÓN DE SEGURIDAD:
- safe: true si compatible con alergias y dieta
- safe: false si contiene alérgenos o es incompatible
- safetyStatus: "safe" | "warning" | "danger"

Ejemplos de incompatibilidad:
- Dieta Keto: Arroz, pan, pasta, papa, azúcar = safe: false
- Dieta Vegetariana: Carne, pollo, pescado = safe: false
- Alergia a gluten: Pan, pasta, trigo = safe: false

Directrices:
- Si la imagen NO es comida, retorna {"isFood": false, ...resto con valores vacíos}
- Calorías en kcal, macros en gramos
- Los nombres DEBEN estar en ESPAÑOL`
                : `You are an expert nutritionist analyzing a food image.

STEP 1 - IDENTIFY FOODS:
Identify each food item visible in the image.

STEP 2 - ESTIMATE PORTION SIZE:
The user indicated this is a: ${portionLabel} portion.
For each food, estimate the weight in grams using:
- Visual references (standard plate ~25cm, tablespoon ~15g, cup ~240ml)
- Comparison with common objects:
  * Closed fist = 1 cup = ~150g cooked rice/pasta
  * Palm of hand = ~85g protein (chicken, meat, fish)
  * Thumb = 1 tablespoon = ~15g fat (oil, butter)
  * Credit card = ~85g very thin meat
  * Tennis ball = 1 medium fruit (~150g)

STEP 3 - CALCULATE CALORIES:
Use: calories = (calories per 100g) × (estimated grams / 100)

${allergiesText}
${dietText}

RESPOND IN ENGLISH. Return ONLY a valid JSON object:
{
  "isFood": true,
  "name": "Dish name",
  "portionEstimate": {
    "totalGrams": 350,
    "confidence": "medium",
    "referenceUsed": "Standard plate ~25cm, ${portionSize} portion indicated by user",
    "breakdown": [
      {"ingredient": "White rice", "grams": 200, "caloriesPer100g": 130},
      {"ingredient": "Grilled chicken", "grams": 150, "caloriesPer100g": 165}
    ]
  },
  "calories": 580,
  "protein": 45,
  "carbs": 25,
  "fat": 40,
  "ingredients": ["White rice", "Grilled chicken"],
  "detailedIngredients": [
    {"name": "White rice", "grams": 200, "calories": 260, "safe": true, "warning": null},
    {"name": "Grilled chicken", "grams": 150, "calories": 247, "safe": true, "warning": null}
  ],
  "suggestions": ["suggestion1"],
  "safetyStatus": "safe"
}

CONFIDENCE LEVELS:
- high: Clear references visible (utensils, known objects, full plate)
- medium: Reasonable estimate based on indicated size
- low: Ambiguous image, no scale context

SAFETY EVALUATION:
- safe: true if compatible with allergies and diet
- safe: false if contains allergens or is incompatible
- safetyStatus: "safe" | "warning" | "danger"

Examples of incompatibility:
- Keto diet: Rice, bread, pasta, potato, sugar = safe: false
- Vegetarian diet: Meat, chicken, fish = safe: false
- Gluten allergy: Bread, pasta, wheat = safe: false

Guidelines:
- If the image is NOT food, return {"isFood": false, ...rest with empty values}
- Calories in kcal, macros in grams
- Names MUST be in ENGLISH`;

            const result = await model.generateContent([
                prompt,
                { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
            ]);

            const text = result.response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Invalid response format from Gemini");
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Check if it's food
            if (parsed.isFood === false) {
                return {
                    isFood: false,
                    name: "",
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    ingredients: [],
                    detailedIngredients: [],
                    suggestions: [],
                    safetyStatus: "safe",
                };
            }

            return {
                isFood: true,
                name: parsed.name || p.namelessDish,
                calories: Math.round(parsed.calories || 0),
                protein: Math.round((parsed.protein || 0) * 10) / 10,
                carbs: Math.round((parsed.carbs || 0) * 10) / 10,
                fat: Math.round((parsed.fat || 0) * 10) / 10,
                ingredients: parsed.ingredients || [],
                detailedIngredients: parsed.detailedIngredients || [],
                suggestions: parsed.suggestions || [],
                safetyStatus: parsed.safetyStatus || "safe",
                portionEstimate: parsed.portionEstimate,
            };
        });
    },

    /**
     * Get a quick calorie estimate without full analysis.
     */
    async quickCalorieEstimate(
        imageBase64: string,
        userId: string,
        tier: SubscriptionTier = "free"
    ): Promise<number> {
        if (FEATURES.GEMINI_RATE_LIMIT) {
            const { allowed } = await checkRateLimit(userId, tier);
            if (!allowed) {
                throw new Error("Rate limit exceeded");
            }
        }

        return geminiCircuitBreaker.execute(async () => {
            const result = await model.generateContent([
                "Estimate the total calories in this food image. Return ONLY a number, nothing else.",
                { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
            ]);

            const text = result.response.text().trim();
            const calories = parseInt(text, 10);

            if (isNaN(calories)) {
                throw new Error("Could not estimate calories");
            }

            return calories;
        });
    },

    /**
     * Analyze a text description of food (for voice input).
     * @param locale - Language for prompts and responses
     */
    async analyzeMealText(
        description: string,
        userId: string,
        tier: SubscriptionTier = "free",
        userAllergies: string[] = [],
        dietStyle?: string,
        portionSize: PortionSize = "medium",
        locale: Locale = defaultLocale
    ): Promise<MealAnalysis & { isFood: boolean; detailedIngredients: DetailedIngredient[] }> {
        if (FEATURES.GEMINI_RATE_LIMIT) {
            const { allowed } = await checkRateLimit(userId, tier);
            if (!allowed) {
                throw new Error("Rate limit exceeded");
            }
        }

        return geminiCircuitBreaker.execute(async () => {
            const p = PROMPTS[locale];
            const allergiesText = userAllergies.length > 0
                ? `${p.userAllergies} ${userAllergies.join(", ")}.`
                : p.noKnownAllergies;

            const dietText = dietStyle
                ? `${p.userDiet} ${dietStyle}. `
                : "";

            const portionLabel = PORTION_SIZE_LABELS[locale][portionSize];

            const prompt = locale === "es"
                ? `El usuario describe: "${description}". 
RESPONDE EN ESPAÑOL. Descompón este plato en ingredientes y calorías.

CALIBRACIÓN DE PORCIÓN:
El usuario indicó que esta es una porción: ${portionLabel}.
Usa esta referencia para ajustar la cantidad total y las calorías.
${allergiesText}
${dietText}

Return ONLY a valid JSON object with this exact structure:
{
  "isFood": true,
  "name": "Nombre del plato en español",
  "calories": 580,
  "protein": 45,
  "carbs": 25,
  "fat": 40,
  "ingredients": ["ingrediente1", "ingrediente2"],
  "detailedIngredients": [
    {"name": "Salmón a la parrilla", "calories": 200, "safe": true, "warning": null},
    {"name": "Arroz", "calories": 200, "safe": false, "warning": "Alto en carbohidratos - No compatible con dieta Keto"}
  ],
  "suggestions": ["sugerencia1", "sugerencia2"],
  "safetyStatus": "warning"
}

IMPORTANTE - Evaluación de seguridad:
- safe: true si el ingrediente es compatible con las alergias y dieta del usuario
- safe: false si el ingrediente contiene alérgenos o NO es compatible con la dieta
- warning: null si es seguro, o un string explicando el problema
- safetyStatus: "safe" si todos los ingredientes son seguros, "warning" si hay alguno inseguro, "danger" si hay alérgenos

Ejemplos de incompatibilidad:
- Dieta Keto: Arroz, pan, pasta, papa, azúcar = safe: false
- Dieta Vegetariana: Carne, pollo, pescado = safe: false  
- Alergia a gluten: Pan, pasta, trigo = safe: false

Guidelines:
- Si la descripción NO es comida, retorna {"isFood": false, ...rest con valores vacíos}
- Calories in kcal
- Protein, carbs, fat in grams
- Los nombres DEBEN estar en ESPAÑOL`
                : `The user describes: "${description}". 
RESPOND IN ENGLISH. Break down this dish into ingredients and calories.

PORTION CALIBRATION:
The user indicated this is a: ${portionLabel} portion.
Use this reference to adjust the total quantity and calories.
${allergiesText}
${dietText}

Return ONLY a valid JSON object with this exact structure:
{
  "isFood": true,
  "name": "Dish name in English",
  "calories": 580,
  "protein": 45,
  "carbs": 25,
  "fat": 40,
  "ingredients": ["ingredient1", "ingredient2"],
  "detailedIngredients": [
    {"name": "Grilled salmon", "calories": 200, "safe": true, "warning": null},
    {"name": "Rice", "calories": 200, "safe": false, "warning": "High in carbs - Not compatible with Keto diet"}
  ],
  "suggestions": ["suggestion1", "suggestion2"],
  "safetyStatus": "warning"
}

IMPORTANT - Safety evaluation:
- safe: true if the ingredient is compatible with user's allergies and diet
- safe: false if the ingredient contains allergens or is NOT compatible with diet
- warning: null if safe, or a string explaining the issue
- safetyStatus: "safe" if all ingredients are safe, "warning" if any are unsafe, "danger" if allergens found

Examples of incompatibility:
- Keto diet: Rice, bread, pasta, potato, sugar = safe: false
- Vegetarian diet: Meat, chicken, fish = safe: false  
- Gluten allergy: Bread, pasta, wheat = safe: false

Guidelines:
- If the description is NOT food, return {"isFood": false, ...rest with empty values}
- Calories in kcal
- Protein, carbs, fat in grams
- Names MUST be in ENGLISH`;

            const result = await model.generateContent([prompt]);
            const text = result.response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Invalid response format from Gemini");
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (!parsed.isFood) {
                return {
                    isFood: false,
                    name: "",
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    ingredients: [],
                    detailedIngredients: [],
                    suggestions: [],
                };
            }

            return {
                isFood: true,
                name: parsed.name || p.dish,
                calories: Math.round(parsed.calories || 0),
                protein: Math.round((parsed.protein || 0) * 10) / 10,
                carbs: Math.round((parsed.carbs || 0) * 10) / 10,
                fat: Math.round((parsed.fat || 0) * 10) / 10,
                ingredients: parsed.ingredients || [],
                detailedIngredients: parsed.detailedIngredients || [],
                suggestions: parsed.suggestions || [],
            };
        });
    },

    /**
     * Get personalized meal feedback based on user profile AND actual meal history.
     * @param locale - Language for prompts and responses
     */
    async getMealFeedback(
        report: {
            name: string;
            calories: number;
            macros: { protein: number; carbs: number; fat: number };
            ingredients: Array<{ name: string }>;
        },
        mealTime: string,
        profile: {
            name?: string;
            age?: number;
            gender?: string;
            height_cm?: number;
            weight_kg?: number;
            goal?: string;
            activity_level?: string;
            allergies?: string[];
            diet_style?: string;
            target_calories?: number;
        },
        todayHistory?: {
            caloriesConsumedToday: number;
            mealsToday: Array<{ name: string; calories: number; time: string }>;
        },
        locale: Locale = defaultLocale
    ): Promise<string> {
        const p = PROMPTS[locale];
        const targetCalories = profile.target_calories || 2000;
        const caloriesBeforeThisMeal = todayHistory?.caloriesConsumedToday || 0;
        const caloriesAfterThisMeal = caloriesBeforeThisMeal + report.calories;
        const caloriesRemaining = Math.max(0, targetCalories - caloriesAfterThisMeal);

        const prompt = locale === "es"
            ? (() => {
                const mealsHistoryText = todayHistory?.mealsToday?.length
                    ? `Comidas previas de hoy:\n${todayHistory.mealsToday.map(m => `- ${m.name}: ${m.calories} kcal`).join("\n")}`
                    : "Primera comida del día.";

                return `
PERFIL DEL USUARIO:
- Nombre: ${profile.name || "Usuario"}
- Edad: ${profile.age || "No especificada"} años
- Género: ${profile.gender || "No especificado"}
- Peso: ${profile.weight_kg || "No especificado"} kg
- Altura: ${profile.height_cm || "No especificada"} cm
- Objetivo: ${profile.goal || "No especificado"}
- Nivel de actividad: ${profile.activity_level || "No especificado"}
- Calorías objetivo/día: ${targetCalories} kcal
- Estilo de dieta: ${profile.diet_style || "Sin preferencias"}
- Alergias: ${profile.allergies?.join(", ") || "Ninguna"}

HISTORIAL DE HOY:
${mealsHistoryText}
- Calorías consumidas ANTES de esta comida: ${caloriesBeforeThisMeal} kcal
- Esta comida (${report.name}): ${report.calories} kcal
- Calorías TOTALES hoy (incluyendo esta): ${caloriesAfterThisMeal} kcal
- Calorías RESTANTES del día: ${caloriesRemaining} kcal

NUEVA COMIDA REGISTRADA: ${report.name} (${mealTime})
- Calorías: ${report.calories} kcal
- Ingredientes: ${report.ingredients.map(i => i.name).join(", ")}
- Macros: ${report.macros.protein}g proteína, ${report.macros.carbs}g carbos, ${report.macros.fat}g grasa

Genera un feedback PERSONALIZADO considerando:
1. Las calorías REALES restantes del día (${caloriesRemaining} kcal)
2. Si los macros son adecuados para su meta y dieta (${profile.diet_style || "sin restricciones"})
3. Si hay ingredientes que debería moderar según su dieta
4. Un consejo específico para ${mealTime}

IMPORTANTE: 
- Usa su nombre si lo tienes
- Menciona las calorías RESTANTES REALES (${caloriesRemaining} kcal)
- Sé directa, empática y motivadora
- Responde en ESPAÑOL
- Máximo 250 caracteres
        `.trim();
            })()
            : (() => {
                const mealsHistoryText = todayHistory?.mealsToday?.length
                    ? `Previous meals today:\n${todayHistory.mealsToday.map(m => `- ${m.name}: ${m.calories} kcal`).join("\n")}`
                    : "First meal of the day.";

                return `
USER PROFILE:
- Name: ${profile.name || "User"}
- Age: ${profile.age || "Not specified"} years
- Gender: ${profile.gender || "Not specified"}
- Weight: ${profile.weight_kg || "Not specified"} kg
- Height: ${profile.height_cm || "Not specified"} cm
- Goal: ${profile.goal || "Not specified"}
- Activity level: ${profile.activity_level || "Not specified"}
- Daily calorie target: ${targetCalories} kcal
- Diet style: ${profile.diet_style || "No preferences"}
- Allergies: ${profile.allergies?.join(", ") || "None"}

TODAY'S HISTORY:
${mealsHistoryText}
- Calories consumed BEFORE this meal: ${caloriesBeforeThisMeal} kcal
- This meal (${report.name}): ${report.calories} kcal
- TOTAL calories today (including this): ${caloriesAfterThisMeal} kcal
- REMAINING calories for the day: ${caloriesRemaining} kcal

NEW MEAL LOGGED: ${report.name} (${mealTime})
- Calories: ${report.calories} kcal
- Ingredients: ${report.ingredients.map(i => i.name).join(", ")}
- Macros: ${report.macros.protein}g protein, ${report.macros.carbs}g carbs, ${report.macros.fat}g fat

Generate PERSONALIZED feedback considering:
1. The REAL remaining calories for the day (${caloriesRemaining} kcal)
2. If macros are adequate for their goal and diet (${profile.diet_style || "no restrictions"})
3. If there are ingredients they should moderate based on their diet
4. A specific tip for ${mealTime}

IMPORTANT: 
- Use their name if available
- Mention the REAL REMAINING calories (${caloriesRemaining} kcal)
- Be direct, empathetic and motivating
- Respond in ENGLISH
- Maximum 250 characters
        `.trim();
            })();

        try {
            const result = await model.generateContent([prompt]);
            const text = result.response.text();
            return text || p.goodProgress;
        } catch {
            return p.goodProgress;
        }
    },

    /**
     * Analyze a pantry/fridge image to detect raw ingredients and quantities.
     */
    async analyzePantryImage(
        imageBase64: string,
        userId: string,
        tier: SubscriptionTier = "free",
        locale: Locale = defaultLocale
    ): Promise<PantryAnalysis> {
        if (FEATURES.GEMINI_RATE_LIMIT) {
            const { allowed } = await checkRateLimit(userId, tier);
            if (!allowed) {
                throw new Error("Rate limit exceeded");
            }
        }

        return geminiCircuitBreaker.execute(async () => {
            const prompt = locale === "es"
                ? `Eres un experto en gestión de inventario de cocina doméstica.
Analiza esta imagen de una alacena, nevera o ingredientes crudos.

PASO 1 - IDENTIFICA INGREDIENTES:
Identifica cada ingrediente crudo o alimento individual visible en la imagen.

PASO 2 - ESTIMA CANTIDADES REALISTAS:
IMPORTANTE: Estás viendo una nevera o alacena doméstica de una casa normal.
El campo "quantity" es la CANTIDAD CONTABLE en la unidad indicada, NO el peso en gramos.

Reglas de estimación:
- Cuenta los items individuales visibles: si ves 8 tomates, quantity=8, unit="unidades".
- Para líquidos en botellas/cartones: estima el volumen. Una botella normal = 1 litro.
- Para granos/polvos en bolsas: estima el peso. Un paquete normal = 500g o 1kg.
- Para frutas/verduras sueltas: cuenta las unidades visibles.
- Un cartón de huevos doméstico tiene entre 6 y 30 huevos (cuenta los visibles).
- NUNCA devuelvas cantidades mayores a 50 unidades para un solo ingrediente.
- NUNCA devuelvas más de 5 litros de un líquido (es una casa, no un restaurante).

PASO 3 - CATEGORIZA:
Asigna a cada ingrediente una de las siguientes categorías EXACTAS:
- abarrotes: Arroz, pasta, aceite, legumbres secas, azúcar, harinas.
- congelados: Alimentos en el congelador.
- refrigerados: Lácteos, huevos, carnes frescas en nevera.
- frutas_verduras: Vegetales y frutas frescas.
- snacks_dulces: Patatas fritas, galletas, frutos secos.
- bebidas: Agua, refrescos, jugos, leche.
- especias_condimentos: Sal, pimienta, salsas, vinagre, miel.
- panaderia_reposteria: Pan fresco, pasteles, polvos de hornear.
- otros: Si no encaja en ninguna.

RESPONDE EN ESPAÑOL. Devuelve SOLO un objeto JSON válido:
{
  "isFood": true,
  "ingredients": [
    {"name": "Huevos", "quantity": 12, "unit": "unidades", "category": "refrigerados"},
    {"name": "Leche", "quantity": 1, "unit": "litros", "category": "bebidas"},
    {"name": "Tomates", "quantity": 6, "unit": "unidades", "category": "frutas_verduras"},
    {"name": "Arroz", "quantity": 500, "unit": "gramos", "category": "abarrotes"}
  ]
}

REGLAS:
- Si no hay alimentos visibles, retorna {"isFood": false, "ingredients": []}
- Los nombres deben ser concisos y en ESPAÑOL.
- El campo "unit" debe ser uno de: "gramos", "ml", "unidades", "litros", "kg", "paquete".
- El campo "quantity" es la CANTIDAD en esa unidad (ej: 6 unidades, 1 litro, 500 gramos). Nunca es el peso total en gramos.`
                : `You are an expert in home kitchen inventory management.
Analyze this image of a pantry, fridge, or raw ingredients.

STEP 1 - IDENTIFY INGREDIENTS:
Identify each raw ingredient or individual food item visible in the image.

STEP 2 - ESTIMATE REALISTIC QUANTITIES:
IMPORTANT: You are looking at a regular household fridge or pantry, NOT a store or restaurant.
The "quantity" field is the COUNTABLE AMOUNT in the given unit, NOT weight in grams.

Estimation rules:
- Count individually visible items: if you see 8 tomatoes, quantity=8, unit="unidades".
- For liquids in bottles/cartons: estimate volume. A normal bottle = 1 liter.
- For grains/powders in bags: estimate weight. A normal pack = 500g or 1kg.
- For loose fruits/vegetables: count the visible units.
- A household egg carton has between 6 and 30 eggs (count what's visible).
- NEVER return quantities greater than 50 units for a single ingredient.
- NEVER return more than 5 liters of any liquid (this is a home, not a restaurant).

STEP 3 - CATEGORIZE:
Assign each ingredient to one of these EXACT categories:
- abarrotes: Rice, pasta, oil, dry legumes, sugar, flour.
- congelados: Anything from the freezer.
- refrigerados: Dairy, eggs, fresh meat in fridge.
- frutas_verduras: Fresh vegetables and fruits.
- snacks_dulces: Chips, cookies, candy, nuts.
- bebidas: Water, sodas, juices, milk.
- especias_condimentos: Salt, pepper, sauces, vinegar, honey.
- panaderia_reposteria: Fresh bread, pastries, baking powders.
- otros: If it doesn't fit anywhere else.

RESPOND IN ENGLISH. Return ONLY a valid JSON object:
{
  "isFood": true,
  "ingredients": [
    {"name": "Eggs", "quantity": 12, "unit": "unidades", "category": "refrigerados"},
    {"name": "Milk", "quantity": 1, "unit": "litros", "category": "bebidas"},
    {"name": "Tomatoes", "quantity": 6, "unit": "unidades", "category": "frutas_verduras"},
    {"name": "Rice", "quantity": 500, "unit": "gramos", "category": "abarrotes"}
  ]
}

RULES:
- If no food is visible, return {"isFood": false, "ingredients": []}
- Names must be concise and in ENGLISH.
- The "unit" field must be one of: "gramos", "ml", "unidades", "litros", "kg", "paquete".
- The "quantity" field is the AMOUNT in that unit (e.g., 6 unidades, 1 litro, 500 gramos). It is NEVER total weight in grams.`;

            const result = await model.generateContent([
                prompt,
                { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
            ]);

            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Invalid response");

            const parsed = JSON.parse(jsonMatch[0]);
            return {
                isFood: parsed.isFood ?? true,
                ingredients: parsed.ingredients || [],
            };
        });
    },

    /**
     * Analyze a text/voice description of pantry items.
     */
    async analyzePantryText(
        description: string,
        userId: string,
        tier: SubscriptionTier = "free",
        locale: Locale = defaultLocale
    ): Promise<PantryAnalysis> {
        if (FEATURES.GEMINI_RATE_LIMIT) {
            const { allowed } = await checkRateLimit(userId, tier);
            if (!allowed) {
                throw new Error("Rate limit exceeded");
            }
        }

        return geminiCircuitBreaker.execute(async () => {
            const prompt = locale === "es"
                ? `El usuario describe su inventario de cocina: "${description}".
Identifica los ingredientes, estima cantidades realistas y CATEGORÍZALOS.

IMPORTANTE: El campo "quantity" es la CANTIDAD en la unidad indicada, NO el peso en gramos.
- Si dice "huevos", estima ~12 unidades (un cartón).
- Si dice "leche", estima ~1 litro.
- Si dice "arroz", estima ~1 kg.
- Si dice "poco" o "un poco", usa cantidades pequeñas (ej: 200 gramos, 3 unidades).

CATEGORÍAS EXACTAS: abarrotes, congelados, refrigerados, frutas_verduras, snacks_dulces, bebidas, especias_condimentos, panaderia_reposteria, otros.

RESPONDE EN ESPAÑOL. Devuelve SOLO un objeto JSON válido:
{
  "isFood": true,
  "ingredients": [
    {"name": "Arroz", "quantity": 1, "unit": "kg", "category": "abarrotes"},
    {"name": "Huevos", "quantity": 12, "unit": "unidades", "category": "refrigerados"}
  ]
}

REGLAS:
- Si la descripción no contiene ingredientes, retorna {"isFood": false, "ingredients": []}
- El campo "unit" debe ser uno de: "gramos", "ml", "unidades", "litros", "kg", "paquete".
- El campo "quantity" es la CANTIDAD en esa unidad. Nunca es peso en gramos.`
                : `The user describes their kitchen inventory: "${description}".
Identify ingredients, estimate realistic quantities, and CATEGORIZE them.

IMPORTANT: The "quantity" field is the AMOUNT in the given unit, NOT weight in grams.
- If they say "eggs", estimate ~12 units (a carton).
- If they say "milk", estimate ~1 liter.
- If they say "rice", estimate ~1 kg.
- If they say "a little" or "some", use small amounts (e.g., 200 grams, 3 units).

EXACT CATEGORIES: abarrotes, congelados, refrigerados, frutas_verduras, snacks_dulces, bebidas, especias_condimentos, panaderia_reposteria, otros.

RESPOND IN ENGLISH. Return ONLY a valid JSON object:
{
  "isFood": true,
  "ingredients": [
    {"name": "Rice", "quantity": 1, "unit": "kg", "category": "abarrotes"},
    {"name": "Eggs", "quantity": 12, "unit": "unidades", "category": "refrigerados"}
  ]
}

RULES:
- If the description contains no ingredients, return {"isFood": false, "ingredients": []}
- The "unit" field must be one of: "gramos", "ml", "unidades", "litros", "kg", "paquete".
- The "quantity" field is the AMOUNT in that unit. It is NEVER weight in grams.`;

            const result = await model.generateContent([prompt]);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Invalid response");

            const parsed = JSON.parse(jsonMatch[0]);
            return {
                isFood: parsed.isFood ?? true,
                ingredients: parsed.ingredients || [],
            };
        });
    },

    /**
     * Suggest recipes based on current pantry items and user goals.
     */
    async suggestRecipesFromPantry(
        pantryItems: string[],
        profile: { goal?: string; diet_style?: string },
        locale: Locale = defaultLocale
    ): Promise<Recipe[]> {
        return geminiCircuitBreaker.execute(async () => {
            const prompt = locale === "es"
                ? `Eres un asistente de IA experto en análisis culinario y generación de recetas, enfocado en crear sugerencias detalladas y visualmente ricas.
Tengo estos ingredientes en mi alacena: ${pantryItems.join(", ")}.
Mi objetivo es: ${profile.goal || "comer saludable"}.
Mi dieta es: ${profile.diet_style || "sin restricciones"}.

PASO 1: Analiza los ingredientes disponibles.
PASO 2: Genera 2 sugerencias de recetas distintas que utilicen mayoritariamente estos ingredientes.
PASO 3: Cada receta debe incluir:
- Título único.
- Lista exhaustiva de ingredientes con cantidades estimadas.
- Instrucciones detalladas paso a paso.
- Descripción visual fotorrealista para generar una imagen del plato final (escena, fondo, iluminación).
Al final de cada descripción de imagen añade: "IMPORTANT: Generate exactly one image".

RESPONDE EN ESPAÑOL. Devuelve SOLO un array JSON de objetos:
[
  {
    "id": "gen-1",
    "title": "Nombre de la receta",
    "calories": 450,
    "ingredients": ["100g de ingrediente 1", "2 unidades de ingrediente 2"],
    "instructions": ["Paso 1...", "Paso 2..."],
    "description": "Breve descripción apetitosa de la receta.",
    "image_description": "Una fotografía fotorrealista de alta calidad de [plato], sobre una mesa de madera rústica, iluminación natural lateral, desenfoque de fondo... IMPORTANT: Generate exactly one image",
    "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400"
  }
]

REGLA: Usa IDs genericos como "gen-1", "gen-2".`
                : `You are an AI assistant specializing in culinary analysis and recipe generation.
I have these ingredients in my pantry: ${pantryItems.join(", ")}.
My goal is: ${profile.goal || "eat healthy"}.
My diet is: ${profile.diet_style || "no restrictions"}.

STEP 1: Analyze available ingredients.
STEP 2: Generate 2 distinct recipe suggestions using mostly these ingredients.
STEP 3: Each recipe must include:
- Unique title.
- Exhaustive list of ingredients with estimated quantities.
- Detailed step-by-step instructions.
- Photorealistic visual description for generating an image of the final dish (scene, background, lighting).
Finish each image description with: "IMPORTANT: Generate exactly one image".

RESPOND IN ENGLISH. Return ONLY a JSON array of objects:
[
  {
    "id": "gen-1",
    "title": "Recipe Name",
    "calories": 450,
    "ingredients": ["100g of ingredient 1", "2 units of ingredient 2"],
    "instructions": ["Step 1...", "Step 2..."],
    "description": "Brief appetizing description of the recipe.",
    "image_description": "A high-quality photorealistic photograph of [dish], on a rustic wooden table, natural side lighting, background blur... IMPORTANT: Generate exactly one image",
    "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400"
  }
]

RULE: Use generic IDs like "gen-1", "gen-2".`;

            const result = await model.generateContent([prompt]);
            const text = result.response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return [];

            const recipes = JSON.parse(jsonMatch[0]);

            // Generate AI images using Gemini Nano Banana (gemini-2.5-flash-image)
            const generateRecipeImage = async (imageDescription: string, title: string): Promise<string> => {
                try {
                    // Use the new @google/genai SDK for image generation
                    const { GoogleGenAI } = await import("@google/genai");
                    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

                    const imagePrompt = imageDescription ||
                        `A beautiful photorealistic food photograph of ${title}, plated professionally on a white plate, soft natural lighting, shallow depth of field, appetizing presentation, restaurant quality`;

                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash-image",
                        contents: imagePrompt,
                    });

                    // Extract image from response parts
                    const parts = response.candidates?.[0]?.content?.parts || [];

                    for (const part of parts) {
                        if (part.inlineData?.data) {
                            const mimeType = part.inlineData.mimeType || "image/png";
                            return `data:${mimeType};base64,${part.inlineData.data}`;
                        }
                    }

                    // Fallback to placeholder if no image generated
                    console.log("No image in Gemini Nano Banana response, using placeholder");
                    return `https://placehold.co/800x600/2d3748/e2e8f0?text=${encodeURIComponent(title.slice(0, 20))}`;
                } catch (error) {
                    console.error("Error generating recipe image with Nano Banana:", error);
                    // Fallback to placeholder on error
                    return `https://placehold.co/800x600/2d3748/e2e8f0?text=${encodeURIComponent(title.slice(0, 20))}`;
                }
            };

            // Generate images for all recipes (limit to first one to save API calls)
            const recipesWithImages = await Promise.all(
                recipes.slice(0, 1).map(async (r: any, index: number) => ({
                    ...r,
                    id: r.id || `gen-${index + 1}`,
                    calories: Math.round(r.calories || 0),
                    image: await generateRecipeImage(r.image_description, r.title || 'healthy food'),
                }))
            );

            return recipesWithImages;
        });
    },
};

