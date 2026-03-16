"use client";

import { useState, useRef, useEffect } from "react";
import type { AnalyzedMeal } from "@/types/api.types";
import { AccessibleModal } from "@/components/ui/AccessibleModal";

interface AddMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialFile?: File | null;
    mode?: "camera" | "gallery" | "voice";
}

type Step = "select" | "preview" | "analyzing" | "result" | "error" | "voice";

export function AddMealModal({
    isOpen,
    onClose,
    onSuccess,
    initialFile,
    mode = "camera",
}: AddMealModalProps) {
    const [step, setStep] = useState<Step>("select");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [analyzedMeal, setAnalyzedMeal] = useState<AnalyzedMeal | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [voiceText, setVoiceText] = useState("");
    const [interimText, setInterimText] = useState("");

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    // Handle initialFile from ScannerTab
    useEffect(() => {
        if (initialFile && isOpen) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setImagePreview(base64);
                setStep("preview");
            };
            reader.readAsDataURL(initialFile);
        }
    }, [initialFile, isOpen]);

    // Auto-trigger based on mode when modal opens
    useEffect(() => {
        if (isOpen && !initialFile && step === "select") {
            if (mode === "camera") {
                // Small delay to ensure modal is rendered
                setTimeout(() => cameraInputRef.current?.click(), 100);
            } else if (mode === "voice") {
                setStep("voice");
            }
        }
    }, [isOpen, mode, initialFile, step]);

    function handleClose() {
        setStep("select");
        setImagePreview(null);
        setAnalyzedMeal(null);
        setError(null);
        setVoiceText("");
        setIsRecording(false);
        onClose();
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setImagePreview(base64);
            setStep("preview");
        };
        reader.readAsDataURL(file);
    }

    async function handleAnalyze() {
        if (!imagePreview) return;

        setStep("analyzing");
        setError(null);

        try {
            const base64Data = imagePreview.split(",")[1];

            const response = await fetch("/api/meals/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64Data }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Error al analizar");
            }

            const data = await response.json();
            setAnalyzedMeal(data.data);
            setStep("result");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
            setStep("error");
        }
    }

    async function handleVoiceAnalyze() {
        if (!voiceText.trim()) return;

        setStep("analyzing");
        setError(null);

        try {
            const response = await fetch("/api/meals/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: voiceText }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Error al analizar");
            }

            const data = await response.json();
            setAnalyzedMeal(data.data);
            setStep("result");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
            setStep("error");
        }
    }

    function toggleRecording() {
        if (isRecording) {
            // Stop recording
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
        } else {
            setIsRecording(true);
            setInterimText("");

            // Start speech recognition
            const SpeechRecognitionAPI =
                (window as unknown as Record<string, unknown>).webkitSpeechRecognition ||
                (window as unknown as Record<string, unknown>).SpeechRecognition;

            if (SpeechRecognitionAPI) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const recognition = new (SpeechRecognitionAPI as any)();
                recognitionRef.current = recognition;

                recognition.lang = "es-ES";
                recognition.continuous = false;
                recognition.interimResults = true; // Enable live feedback
                recognition.maxAlternatives = 1;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recognition.onresult = (event: any) => {
                    let interim = "";
                    let final = "";

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            final += transcript;
                        } else {
                            interim += transcript;
                        }
                    }

                    // Show interim results as they come
                    if (interim) {
                        setInterimText(interim);
                    }

                    // When we get a final result, update voiceText
                    if (final) {
                        setVoiceText((prev) => prev ? prev + " " + final : final);
                        setInterimText("");
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error:", event.error);
                    setIsRecording(false);
                    recognitionRef.current = null;
                    if (event.error === "no-speech") {
                        // No speech detected, that's ok
                    } else {
                        setError("Error en el reconocimiento de voz: " + event.error);
                    }
                };

                recognition.onend = () => {
                    setIsRecording(false);
                    setInterimText("");
                    recognitionRef.current = null;
                };

                recognition.onspeechend = () => {
                    // User stopped speaking, stop recognition
                    recognition.stop();
                };

                recognition.start();
            } else {
                setError("Tu navegador no soporta reconocimiento de voz");
                setIsRecording(false);
            }
        }
    }

    function handleConfirm() {
        onSuccess();
        handleClose();
    }

    return (
        <AccessibleModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Registrar Comida"
            maxWidth="max-w-md"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200" aria-hidden="true">
                        <span className="text-lg">🍽️</span>
                    </div>
                    <h2 className="text-lg font-black text-slate-800">Registrar Comida</h2>
                </div>
                <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Cerrar modal"
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Select Mode */}
                {step === "select" && (
                    <div className="space-y-4">
                        <p className="text-center text-slate-500 text-sm mb-6">
                            Elige cómo quieres registrar tu comida
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Camera Option */}
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-2xl hover:border-emerald-400 transition-all group"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <span className="font-bold text-emerald-700 text-sm">Tomar Foto</span>
                            </button>

                            {/* Gallery Option */}
                            <button
                                onClick={() => galleryInputRef.current?.click()}
                                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-100 rounded-2xl hover:border-slate-300 transition-all group"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="font-bold text-slate-600 text-sm">Galería</span>
                            </button>
                        </div>

                        {/* Voice Option */}
                        <button
                            onClick={() => setStep("voice")}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-100 rounded-2xl hover:border-violet-400 transition-all group"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <span className="font-bold text-violet-700 text-sm">Describir por Voz</span>
                        </button>

                        {/* Hidden file inputs */}
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                )}

                {/* Voice Input */}
                {step === "voice" && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-slate-600 font-medium mb-2">Describe tu comida</p>
                            <p className="text-slate-400 text-sm">
                                Por ejemplo: "Ensalada con pollo, aguacate y tomate"
                            </p>
                        </div>

                        {/* Voice Recording Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={toggleRecording}
                                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording
                                    ? "bg-rose-500 animate-pulse shadow-xl shadow-rose-200"
                                    : "bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg shadow-violet-200 hover:scale-105"
                                    }`}
                            >
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-center text-xs text-slate-400">
                            {isRecording ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                                    Escuchando... {interimText && <span className="text-violet-500 font-medium">"{interimText}"</span>}
                                </span>
                            ) : "Toca para hablar o escribe abajo"}
                        </p>

                        {/* Text Input with interim overlay */}
                        <div className="relative">
                            <textarea
                                value={voiceText}
                                onChange={(e) => setVoiceText(e.target.value)}
                                placeholder="El texto capturado aparecerá aquí..."
                                className="w-full p-4 border-2 border-slate-100 rounded-2xl resize-none h-28 focus:border-violet-400 focus:ring-0 outline-none text-slate-700"
                            />
                            {/* Interim text indicator */}
                            {isRecording && interimText && (
                                <div className="absolute bottom-3 left-4 right-4 px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl">
                                    <p className="text-xs text-violet-600 italic truncate">
                                        {interimText}...
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep("select")}
                                className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold text-sm"
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleVoiceAnalyze}
                                disabled={!voiceText.trim()}
                                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-violet-200 disabled:opacity-50"
                            >
                                Analizar
                            </button>
                        </div>
                    </div>
                )}

                {/* Preview */}
                {step === "preview" && imagePreview && (
                    <div className="space-y-4">
                        <div className="relative rounded-2xl overflow-hidden shadow-lg">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-64 object-cover"
                            />
                            <button
                                onClick={() => {
                                    setImagePreview(null);
                                    setStep("select");
                                }}
                                className="absolute top-3 right-3 p-2 bg-slate-900/60 backdrop-blur-sm rounded-full text-white hover:bg-slate-900/80 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-center text-slate-500 text-sm">
                            ¿Listo para analizar esta comida?
                        </p>

                        <button
                            onClick={handleAnalyze}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 active:scale-[0.98] transition-transform"
                        >
                            ✨ Analizar con Kili
                        </button>
                    </div>
                )}

                {/* Analyzing */}
                {step === "analyzing" && (
                    <div className="py-12 text-center">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-ping" />
                            <div className="absolute inset-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-spin" style={{ animationDuration: "2s" }} />
                            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                                <span className="text-2xl">🍽️</span>
                            </div>
                        </div>
                        <p className="text-slate-800 font-bold text-lg mb-2">Analizando tu comida...</p>
                        <p className="text-slate-400 text-sm">
                            Kili está identificando ingredientes y nutrientes
                        </p>
                    </div>
                )}

                {/* Result */}
                {step === "result" && analyzedMeal && (
                    <div className="space-y-4">
                        {/* Meal Name */}
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Identificado</p>
                                <h3 className="text-xl font-black text-slate-800">{analyzedMeal.name}</h3>
                            </div>
                        </div>

                        {/* Nutrition Grid */}
                        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-5">
                            <div className="grid grid-cols-4 gap-3 text-center">
                                <div>
                                    <p className="text-2xl font-black text-emerald-600">{analyzedMeal.calories}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Calorías</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-blue-500">{analyzedMeal.protein}g</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Proteína</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-amber-500">{analyzedMeal.carbs}g</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Carbos</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-rose-500">{analyzedMeal.fat}g</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Grasas</p>
                                </div>
                            </div>
                        </div>

                        {/* Ingredients */}
                        {analyzedMeal.ingredients && analyzedMeal.ingredients.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Ingredientes detectados
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {analyzedMeal.ingredients.map((ing, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600"
                                        >
                                            {ing}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setStep("select")}
                                className="flex-1 py-4 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
                            >
                                Retomar
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-[0.98] transition-transform"
                            >
                                ✓ Guardar
                            </button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {step === "error" && (
                    <div className="py-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-rose-100 to-red-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl">😔</span>
                        </div>
                        <p className="text-rose-600 font-bold text-lg mb-2">Error al analizar</p>
                        <p className="text-slate-400 text-sm mb-6">{error}</p>
                        <button
                            onClick={() => setStep("select")}
                            className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-colors"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                )}
            </div>
        </AccessibleModal>
    );
}
