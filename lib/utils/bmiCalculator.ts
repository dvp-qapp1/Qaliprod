export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "ft";

export type BMICategory = "bajo peso" | "normal" | "sobrepeso" | "obesidad";

export interface BMIResult {
    value: number;
    category: BMICategory;
    emoji: string;
    message: string;
    bgColor: string;
}

/**
 * Calculate BMI from weight and height with unit conversions
 */
export function calculateBMI(
    weight: number,
    height: number,
    weightUnit: WeightUnit,
    heightUnit: HeightUnit,
    heightFeet?: number,
    heightInches?: number
): BMIResult {
    // Convert weight to kg
    const weightKg = weightUnit === "lb" ? weight * 0.453592 : weight;

    // Convert height to cm
    let heightCm: number;
    if (heightUnit === "ft") {
        const feet = heightFeet || 0;
        const inches = heightInches || 0;
        heightCm = (feet * 12 + inches) * 2.54;
    } else {
        heightCm = height;
    }

    // Calculate BMI: weight(kg) / height(m)^2
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    // Determine category
    let category: BMICategory;
    let emoji: string;
    let message: string;
    let bgColor: string;

    if (bmi < 18.5) {
        category = "bajo peso";
        emoji = "💨";
        message = "Tu peso está por debajo de lo recomendado.";
        bgColor = "bg-blue-50";
    } else if (bmi < 25) {
        category = "normal";
        emoji = "✨";
        message = "¡Tu peso está en un rango saludable!";
        bgColor = "bg-emerald-50";
    } else if (bmi < 30) {
        category = "sobrepeso";
        emoji = "⚡";
        message = "Tu peso está ligeramente elevado.";
        bgColor = "bg-amber-50";
    } else {
        category = "obesidad";
        emoji = "🔥";
        message = "Es importante cuidar tu alimentación.";
        bgColor = "bg-red-50";
    }

    return {
        value: Math.round(bmi * 10) / 10,
        category,
        emoji,
        message,
        bgColor,
    };
}

/**
 * Convert weight between units
 */
export function convertWeight(
    value: number,
    from: WeightUnit,
    to: WeightUnit
): number {
    if (from === to) return value;
    if (from === "kg" && to === "lb") return value * 2.20462;
    if (from === "lb" && to === "kg") return value * 0.453592;
    return value;
}

/**
 * Convert cm to feet and inches
 */
export function convertCmToFeetInches(cm: number): {
    feet: number;
    inches: number;
} {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
}

/**
 * Convert feet and inches to cm
 */
export function convertHeightToCm(feet: number, inches: number): number {
    return Math.round((feet * 12 + inches) * 2.54);
}

/**
 * Get weight validation range for unit
 */
export function getWeightValidation(unit: WeightUnit): {
    min: number;
    max: number;
} {
    return unit === "kg" ? { min: 25, max: 300 } : { min: 55, max: 660 };
}

/**
 * Check if weight is valid for unit
 */
export function isWeightValid(value: number, unit: WeightUnit): boolean {
    const { min, max } = getWeightValidation(unit);
    return value >= min && value <= max;
}

/**
 * Check if height is valid
 */
export function isHeightValid(
    value: number,
    unit: HeightUnit,
    feet?: number,
    inches?: number
): boolean {
    if (unit === "cm") {
        return value >= 100 && value <= 250;
    }
    // For feet/inches
    const totalInches = (feet || 0) * 12 + (inches || 0);
    return totalInches >= 39 && totalInches <= 98; // ~3'3" to 8'2"
}
