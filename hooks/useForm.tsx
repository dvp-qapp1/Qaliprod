"use client";

import { useState, useCallback, type ChangeEvent, type FormEvent } from "react";

// ============================================================================
// Types
// ============================================================================

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export interface ValidationRule<T> {
    validate: (value: T[keyof T], formData: T) => boolean;
    message: string;
}

export type ValidationRules<T> = Partial<Record<keyof T, ValidationRule<T>[]>>;

export interface UseFormOptions<T> {
    initialValues: T;
    validationRules?: ValidationRules<T>;
    onSubmit?: (values: T) => void | Promise<void>;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
}

export interface UseFormReturn<T> {
    values: T;
    errors: FormErrors<T>;
    touched: Partial<Record<keyof T, boolean>>;
    isSubmitting: boolean;
    isValid: boolean;
    isDirty: boolean;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    setFieldValue: (field: keyof T, value: T[keyof T]) => void;
    setFieldError: (field: keyof T, error: string | undefined) => void;
    validateField: (field: keyof T) => boolean;
    validateForm: () => boolean;
    handleSubmit: (e?: FormEvent) => Promise<void>;
    reset: () => void;
    setValues: (values: Partial<T>) => void;
}

// ============================================================================
// useForm Hook
// ============================================================================

/**
 * Form state management hook with validation support.
 * 
 * @example
 * const form = useForm({
 *   initialValues: { email: '', password: '' },
 *   validationRules: {
 *     email: [
 *       { validate: (v) => !!v, message: 'Email requerido' },
 *       { validate: (v) => /\S+@\S+/.test(v), message: 'Email inválido' },
 *     ],
 *     password: [
 *       { validate: (v) => !!v, message: 'Contraseña requerida' },
 *       { validate: (v) => v.length >= 8, message: 'Mínimo 8 caracteres' },
 *     ],
 *   },
 *   onSubmit: async (values) => {
 *     await login(values);
 *   },
 * });
 * 
 * <form onSubmit={form.handleSubmit}>
 *   <input
 *     name="email"
 *     value={form.values.email}
 *     onChange={form.handleChange}
 *     onBlur={form.handleBlur}
 *   />
 *   {form.errors.email && <span>{form.errors.email}</span>}
 * </form>
 */
export function useForm<T extends Record<string, unknown>>({
    initialValues,
    validationRules = {},
    onSubmit,
    validateOnChange = false,
    validateOnBlur = true,
}: UseFormOptions<T>): UseFormReturn<T> {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<FormErrors<T>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if form has been modified
    const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

    // Check if form is valid (no errors for touched fields)
    const isValid = Object.keys(errors).length === 0;

    // Validate a single field
    const validateField = useCallback((field: keyof T): boolean => {
        const rules = validationRules[field];
        if (!rules) return true;

        for (const rule of rules) {
            if (!rule.validate(values[field], values)) {
                setErrors(prev => ({ ...prev, [field]: rule.message }));
                return false;
            }
        }

        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
        return true;
    }, [values, validationRules]);

    // Validate entire form
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors<T> = {};
        let isValid = true;

        for (const field of Object.keys(validationRules) as (keyof T)[]) {
            const rules = validationRules[field];
            if (!rules) continue;

            for (const rule of rules) {
                if (!rule.validate(values[field], values)) {
                    newErrors[field] = rule.message;
                    isValid = false;
                    break;
                }
            }
        }

        setErrors(newErrors);
        return isValid;
    }, [values, validationRules]);

    // Handle input change
    const handleChange = useCallback((
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        const newValue = type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : value;

        setValues(prev => ({ ...prev, [name]: newValue }));

        if (validateOnChange) {
            setTimeout(() => validateField(name as keyof T), 0);
        }
    }, [validateOnChange, validateField]);

    // Handle input blur
    const handleBlur = useCallback((
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));

        if (validateOnBlur) {
            validateField(name as keyof T);
        }
    }, [validateOnBlur, validateField]);

    // Set a specific field value
    const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
        setValues(prev => ({ ...prev, [field]: value }));
    }, []);

    // Set a specific field error
    const setFieldError = useCallback((field: keyof T, error: string | undefined) => {
        if (error) {
            setErrors(prev => ({ ...prev, [field]: error }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, []);

    // Handle form submission
    const handleSubmit = useCallback(async (e?: FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        // Mark all fields as touched
        const allTouched = Object.keys(validationRules).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {} as Partial<Record<keyof T, boolean>>
        );
        setTouched(allTouched);

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Submit
        if (onSubmit) {
            setIsSubmitting(true);
            try {
                await onSubmit(values);
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [values, validationRules, validateForm, onSubmit]);

    // Reset form to initial values
    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    // Update multiple values at once
    const setMultipleValues = useCallback((newValues: Partial<T>) => {
        setValues(prev => ({ ...prev, ...newValues }));
    }, []);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        isDirty,
        handleChange,
        handleBlur,
        setFieldValue,
        setFieldError,
        validateField,
        validateForm,
        handleSubmit,
        reset,
        setValues: setMultipleValues,
    };
}

// ============================================================================
// Common Validators
// ============================================================================

export const validators = {
    required: (message = "Este campo es requerido"): ValidationRule<Record<string, unknown>> => ({
        validate: (value) => {
            if (typeof value === "string") return value.trim().length > 0;
            if (typeof value === "number") return !isNaN(value);
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== undefined;
        },
        message,
    }),

    email: (message = "Email inválido"): ValidationRule<Record<string, unknown>> => ({
        validate: (value) => {
            if (!value) return true; // Use required for this
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
        },
        message,
    }),

    minLength: (min: number, message?: string): ValidationRule<Record<string, unknown>> => ({
        validate: (value) => {
            if (!value) return true;
            return String(value).length >= min;
        },
        message: message || `Mínimo ${min} caracteres`,
    }),

    maxLength: (max: number, message?: string): ValidationRule<Record<string, unknown>> => ({
        validate: (value) => {
            if (!value) return true;
            return String(value).length <= max;
        },
        message: message || `Máximo ${max} caracteres`,
    }),

    min: (min: number, message?: string): ValidationRule<Record<string, unknown>> => ({
        validate: (value) => {
            if (value === null || value === undefined || value === "") return true;
            return Number(value) >= min;
        },
        message: message || `El valor mínimo es ${min}`,
    }),

    max: (max: number, message?: string): ValidationRule<Record<string, unknown>> => ({
        validate: (value) => {
            if (value === null || value === undefined || value === "") return true;
            return Number(value) <= max;
        },
        message: message || `El valor máximo es ${max}`,
    }),

    pattern: (regex: RegExp, message: string): ValidationRule<Record<string, unknown>> => ({
        validate: (value) => {
            if (!value) return true;
            return regex.test(String(value));
        },
        message,
    }),

    match: (fieldName: string, message?: string): ValidationRule<Record<string, unknown>> => ({
        validate: (value, formData) => {
            return value === formData[fieldName];
        },
        message: message || "Los campos no coinciden",
    }),
};

// ============================================================================
// FormField Component
// ============================================================================

interface FormFieldProps {
    label: string;
    error?: string;
    touched?: boolean;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
}

/**
 * Form field wrapper with label, error, and hint support
 * 
 * @example
 * <FormField 
 *   label="Email" 
 *   error={form.errors.email} 
 *   touched={form.touched.email}
 *   required
 * >
 *   <input name="email" {...} />
 * </FormField>
 */
export function FormField({
    label,
    error,
    touched,
    required,
    hint,
    children
}: FormFieldProps) {
    const showError = error && touched;

    return (
        <div className= "space-y-1.5" >
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1" >
            { label }
    { required && <span className="text-rose-500" >* </span> }
    </label>

    { children }

    {
        showError && (
            <p className="text-xs text-rose-500 font-medium flex items-center gap-1" role = "alert" >
                <svg className="w-3.5 h-3.5" fill = "currentColor" viewBox = "0 0 20 20" >
                    <path fillRule="evenodd" d = "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule = "evenodd" />
                        </svg>
        { error }
        </p>
            )
    }

    {
        hint && !showError && (
            <p className="text-xs text-slate-400" > { hint } </p>
            )
    }
    </div>
    );
}
