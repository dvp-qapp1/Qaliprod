"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { QaliaLogo } from "@/components/ui/QaliaLogo";
import { useDictionary } from "@/contexts/DictionaryContext";
import { AccessibleModal } from "@/components/ui/AccessibleModal";
import { motion, AnimatePresence } from "framer-motion";

// Types matching V1's data structures
interface Ingredient {
    name: string;
    safe: boolean;
    calories: number;
    quantity?: number;
    unit?: string;
    alert?: string;
    category?: string;
}

interface PortionEstimate {
    totalGrams: number;
    confidence: 'high' | 'medium' | 'low';
    referenceUsed: string;
}

interface MealReport {
    isFood: boolean;
    name: string;
    ingredients: Ingredient[];
    calories: number;
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    safetyStatus: "safe" | "warning" | "danger";
    safetyReasoning?: string;
    coachFeedback?: string;
    imageUrl?: string;
    portionEstimate?: PortionEstimate;
}

type MealTime = "breakfast" | "lunch" | "dinner" | "snack";
type PortionSize = "small" | "medium" | "large" | "extra_large";

interface ScannerTabProps {
    initialMode?: "meal" | "pantry";
    initialTab?: "camera" | "voice" | "text";
    showIntro?: boolean;
    onMealSaved: () => void;
    onPantryUpdated?: () => void;
}

type ScannerMode = "camera" | "voice" | "text";
type ScannerStep = "intro" | "upload" | "camera_active" | "portion_select" | "voice_input" | "voice_confirm" | "text_input" | "edit" | "time" | "results";

// Device detection types
type DeviceType = "ios" | "android" | "desktop";

interface DeviceInfo {
    type: DeviceType;
    supportsWebSpeech: boolean;
    supportsContinuous: boolean;
    supportsInterimResults: boolean;
}

// Hook to detect device type and capabilities
function useDeviceInfo(): DeviceInfo {
    const [info] = useState<DeviceInfo>(() => {
        // SSR-safe: default to desktop during server rendering
        if (typeof window === "undefined") {
            return {
                type: "desktop" as DeviceType,
                supportsWebSpeech: false,
                supportsContinuous: true,
                supportsInterimResults: true,
            };
        }

        const userAgent = navigator.userAgent || navigator.vendor;

        // Detect iOS (iPhone, iPad, iPod)
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        // Detect Android
        const isAndroid = /android/i.test(userAgent);

        // Check for Web Speech API support
        const hasWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

        if (isIOS) {
            return {
                type: "ios" as DeviceType,
                supportsWebSpeech: hasWebSpeech,
                supportsContinuous: false,
                supportsInterimResults: true,
            };
        } else if (isAndroid) {
            return {
                type: "android" as DeviceType,
                supportsWebSpeech: hasWebSpeech,
                supportsContinuous: true,
                supportsInterimResults: true,
            };
        }

        return {
            type: "desktop" as DeviceType,
            supportsWebSpeech: hasWebSpeech,
            supportsContinuous: true,
            supportsInterimResults: true,
        };
    });

    return info;
}

const MEAL_TIME_EMOJIS: Record<MealTime, string> = {
    breakfast: "🍳",
    lunch: "🍱",
    dinner: "🥗",
    snack: "🥝",
};

const CATEGORY_ICONS: Record<string, string> = {
    abarrotes: "🥫",
    congelados: "❄️",
    refrigerados: "🥛",
    frutas_verduras: "🥗",
    snacks_dulces: "🍪",
    bebidas: "🥤",
    especias_condimentos: "🧂",
    panaderia_reposteria: "🥐",
    otros: "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
    abarrotes: "bg-amber-50 text-amber-600",
    congelados: "bg-blue-50 text-blue-600",
    refrigerados: "bg-cyan-50 text-cyan-600",
    frutas_verduras: "bg-emerald-50 text-emerald-600",
    snacks_dulces: "bg-rose-50 text-rose-600",
    bebidas: "bg-indigo-50 text-indigo-600",
    especias_condimentos: "bg-slate-50 text-slate-600",
    panaderia_reposteria: "bg-orange-50 text-orange-600",
    otros: "bg-slate-50 text-slate-600",
};

// Mode toggle component with icons
function ModeToggle({ mode, onModeChange }: { mode: ScannerMode; onModeChange: (m: ScannerMode) => void }) {
    const { dictionary } = useDictionary();
    const t = dictionary.dashboard.scanner;

    return (
        <div className="inline-flex bg-slate-100 p-1 rounded-xl shadow-inner">
            <button
                onClick={() => onModeChange("camera")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${mode === "camera" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                    }`}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t.photo}
            </button>
            <button
                onClick={() => onModeChange("voice")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${mode === "voice" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                    }`}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                {t.voice}
            </button>
            <button
                onClick={() => onModeChange("text")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${mode === "text" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                    }`}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t.text}
            </button>
        </div>
    );
}

// Analyzing overlay — visual feedback during AI analysis
function AnalyzingOverlay({
    imageUrl,
    inputMode,
    scannerMode,
    phase = "scanning",
}: {
    imageUrl?: string | null;
    inputMode: "camera" | "voice" | "text";
    scannerMode: "meal" | "pantry";
    phase?: "scanning" | "finalizing";
}) {
    const { dictionary } = useDictionary();
    const t = dictionary.dashboard.scanner;

    const steps = useMemo(() => {
        if (phase === "finalizing") {
            return [t.finalizingStep1, t.finalizingStep2, t.finalizingStep3, t.finalizingStep4, t.finalizingStep5];
        }
        return scannerMode === "pantry"
            ? [t.analyzingStepPantry1, t.analyzingStepPantry2, t.analyzingStepPantry3, t.analyzingStepPantry4, t.analyzingStepPantry5]
            : [t.analyzingStepMeal1, t.analyzingStepMeal2, t.analyzingStepMeal3, t.analyzingStepMeal4, t.analyzingStepMeal5];
    }, [phase, scannerMode, t]);

    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        setCurrentStep(0);
    }, [phase]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 2400);
        return () => clearInterval(interval);
    }, [steps.length]);

    // Emoji: finalizing uses brain, scanning uses plate/pantry
    const modeEmoji = phase === "finalizing" ? "🧠" : (scannerMode === "pantry" ? "🥫" : "🍽️");
    const hasImage = imageUrl && (inputMode === "camera" || phase === "finalizing");

    // Finalizing phase uses amber/gold accent instead of emerald
    const accentColor = phase === "finalizing" ? "amber" : "emerald";
    const scanLineClass = phase === "finalizing"
        ? "bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_4px_rgba(245,158,11,0.6)]"
        : "bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_4px_rgba(16,185,129,0.6)]";
    const scanLineClassSmall = phase === "finalizing"
        ? "bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_2px_rgba(245,158,11,0.4)]"
        : "bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_2px_rgba(16,185,129,0.4)]";
    const bracketColor = phase === "finalizing" ? "border-amber-400" : "border-emerald-400";
    const dotActiveColor = phase === "finalizing" ? "#F59E0B" : "#10B981";
    const brandColor = phase === "finalizing" ? "text-amber-500" : "text-emerald-500";
    const ringColor = phase === "finalizing" ? "border-amber-400/30" : "border-emerald-400/30";

    return (
        <div className="flex flex-col items-center justify-center py-8 gap-6 animate-fadeIn">
            {/* Visual area */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl">
                {hasImage ? (
                    <>
                        {/* Photo preview with pulsing overlay */}
                        <img
                            src={imageUrl}
                            alt="Analyzing"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Dark overlay that pulses */}
                        <motion.div
                            className="absolute inset-0 bg-black/30"
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        {/* Scan line moving top to bottom */}
                        <motion.div
                            className={`absolute left-0 right-0 h-1 ${scanLineClass}`}
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                        {/* Corner brackets */}
                        <div className="absolute inset-3 pointer-events-none">
                            <div className={`absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 ${bracketColor} rounded-tl-lg`} />
                            <div className={`absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 ${bracketColor} rounded-tr-lg`} />
                            <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 ${bracketColor} rounded-bl-lg`} />
                            <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 ${bracketColor} rounded-br-lg`} />
                        </div>
                        {/* Subtle grid overlay */}
                        <div
                            className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{
                                backgroundImage: phase === "finalizing"
                                    ? "linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)"
                                    : "linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)",
                                backgroundSize: "40px 40px",
                            }}
                        />
                    </>
                ) : (
                    /* Voice/text mode — animated emoji */
                    <div className={`absolute inset-0 bg-gradient-to-br ${phase === "finalizing" ? "from-slate-100 to-amber-50" : "from-slate-100 to-emerald-50"} flex items-center justify-center`}>
                        <motion.div
                            className="text-7xl"
                            animate={{
                                scale: [1, 1.15, 1],
                                rotate: [0, 3, -3, 0],
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {modeEmoji}
                        </motion.div>
                        {/* Concentric pulse rings */}
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                className={`absolute w-28 h-28 rounded-full border-2 ${ringColor}`}
                                animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
                            />
                        ))}
                        {/* Scan line */}
                        <motion.div
                            className={`absolute left-0 right-0 h-0.5 ${scanLineClassSmall}`}
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                )}
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5">
                {steps.map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        animate={{
                            backgroundColor: i === currentStep ? dotActiveColor : "#D1D5DB",
                            scale: i === currentStep ? 1.3 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                    />
                ))}
            </div>

            {/* Rotating step text */}
            <div className="h-12 flex flex-col items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={`${phase}-${currentStep}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.35 }}
                        className="font-black text-slate-800 uppercase tracking-widest text-[10px] text-center"
                    >
                        {steps[currentStep]}
                    </motion.p>
                </AnimatePresence>
                <div className="mt-1.5 flex items-center gap-1.5">
                    <QaliaLogo className="w-3.5 h-3.5" />
                    <span className={`text-[9px] ${brandColor} font-bold tracking-wider`}>KILI AI</span>
                </div>
            </div>
        </div>
    );
}

function PortionSelector({
    selected,
    onChange,
    imagePreview,
    onConfirm,
    onCancel
}: {
    selected: PortionSize;
    onChange: (size: PortionSize) => void;
    imagePreview?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const { dictionary } = useDictionary();
    const t = dictionary.dashboard.scanner;

    const options = [
        {
            value: 'small' as PortionSize,
            label: t.portionSmall,
            plateSize: t.portionSmallPlate,
            gramsRange: t.portionSmallGrams,
            comparison: t.portionSmallComparison,
            iconRadius: 6,
        },
        {
            value: 'medium' as PortionSize,
            label: t.portionMedium,
            plateSize: t.portionMediumPlate,
            gramsRange: t.portionMediumGrams,
            comparison: t.portionMediumComparison,
            iconRadius: 8,
        },
        {
            value: 'large' as PortionSize,
            label: t.portionLarge,
            plateSize: t.portionLargePlate,
            gramsRange: t.portionLargeGrams,
            comparison: t.portionLargeComparison,
            iconRadius: 10,
        },
        {
            value: 'extra_large' as PortionSize,
            label: t.portionExtraLarge,
            plateSize: t.portionExtraLargePlate,
            gramsRange: t.portionExtraLargeGrams,
            comparison: t.portionExtraLargeComparison,
            iconRadius: 11,
        },
    ];

    return (
        <div className="max-w-xl mx-auto space-y-3 sm:space-y-6 py-2 sm:py-6 px-4 animate-fadeIn">
            <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tighter">
                    {t.portionTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                    {t.portionSubtitle}
                </p>
            </div>

            {imagePreview && (
                <div className="w-full h-32 sm:h-auto sm:aspect-video rounded-[32px] overflow-hidden bg-slate-100 shadow-lg border-2 border-white">
                    <img src={imagePreview} alt={t.previewAlt} className="w-full h-full object-cover" />
                </div>
            )}

            {/* Portion options - 2x2 Grid for better space utilization */}
            <div className="grid grid-cols-2 gap-3">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`p-3 sm:p-4 rounded-[28px] sm:rounded-[32px] border-2 transition-all flex flex-col items-center text-center gap-2 sm:gap-3 cursor-pointer ${selected === option.value
                            ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
                            : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                            }`}
                        aria-pressed={selected === option.value}
                    >
                        {/* Plate icon */}
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl ${selected === option.value ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                            <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r={option.iconRadius} />
                                <circle cx="12" cy="12" r={Math.max(2.5, option.iconRadius - 2.5)} strokeDasharray="2 1" />
                            </svg>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-1">
                            <span className={`text-sm font-black uppercase tracking-tight ${selected === option.value ? 'text-emerald-700' : 'text-slate-700'
                                }`}>
                                {option.label}
                            </span>
                            <span className={`text-[10px] font-bold ${selected === option.value ? 'text-emerald-500/70' : 'text-slate-400'
                                }`}>
                                {option.plateSize}
                            </span>
                            <p className={`text-[9px] font-medium leading-tight mt-1 ${selected === option.value ? 'text-emerald-600/60' : 'text-slate-400'
                                }`}>
                                {option.gramsRange}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Helper text */}
            <p className="text-center text-[10px] sm:text-xs text-slate-400 px-4 leading-tight">
                {t.portionTip}
            </p>

            <div className="space-y-2 sm:space-y-3 pt-0 sm:pt-2">
                <button
                    onClick={onConfirm}
                    className="w-full py-4 sm:py-5 bg-slate-900 text-emerald-400 rounded-2xl sm:rounded-[24px] font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                    {t.analyzePortion}
                </button>
                <button
                    onClick={onCancel}
                    className="w-full py-2 sm:py-3 text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors cursor-pointer"
                >
                    {t.cancel}
                </button>
            </div>
        </div>
    );
}

export function ScannerTab({
    initialMode = "meal",
    initialTab = "camera",
    showIntro = false,
    onMealSaved,
    onPantryUpdated,
}: ScannerTabProps) {
    const deviceInfo = useDeviceInfo();
    const { dictionary, locale } = useDictionary();
    const t = dictionary.dashboard.scanner;

    const [scannerTabMode, setScannerTabMode] = useState<"meal" | "pantry">(initialMode);
    const [mode, setMode] = useState<ScannerMode>(initialTab);
    const [step, setStep] = useState<ScannerStep>(showIntro ? "intro" : "upload");
    const [isRecording, setIsRecording] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState(""); // Real-time feedback
    const [isEditingTranscript, setIsEditingTranscript] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzingPhase, setAnalyzingPhase] = useState<"scanning" | "finalizing">("scanning");
    const [isSaving, setIsSaving] = useState(false);
    const [textInput, setTextInput] = useState(""); // For text mode

    // Meal report state
    const [report, setReport] = useState<MealReport | null>(null);
    const [selectedMealTime, setSelectedMealTime] = useState<MealTime | null>(null);

    // Portion size selection state
    const [portionSize, setPortionSize] = useState<PortionSize>("medium");
    const [pendingImage, setPendingImage] = useState<{ base64: string; fullUrl: string } | null>(null);
    const [pendingDescription, setPendingDescription] = useState<string | null>(null);

    // New ingredient input
    const [newIngName, setNewIngName] = useState("");
    const [newIngCals, setNewIngCals] = useState("");
    const [newIngUnit, setNewIngUnit] = useState("gramos");

    // Inline editing in review view
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<{ name: string; quantity: string; unit: string }>({ name: "", quantity: "", unit: "gramos" });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);


    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null); // Ref to manually stop recognition
    const voiceTranscriptRef = useRef(""); // Mirror of voiceTranscript to avoid stale closures
    const interimTranscriptRef = useRef(""); // Mirror of interimTranscript

    // Cleanup camera stream on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Analyze image with API (returns without saving)
    const analyzeImage = async (base64: string, selectedPortionSize: PortionSize): Promise<MealReport | null> => {
        try {
            const endpoint = scannerTabMode === "pantry" ? "/api/meals/analyze-pantry" : "/api/meals/analyze-preview";
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64,
                    portionSize: scannerTabMode === "pantry" ? "medium" : selectedPortionSize,
                    locale
                }),
            });

            if (!response.ok) {
                throw new Error(t.analyzeError);
            }

            const data = await response.json();
            return data.data as MealReport;
        } catch (error) {
            console.error("Error analyzing image:", error);
            alert(t.analyzeImageError);
            return null;
        }
    };

    // Analyze text description (returns without saving)
    const analyzeText = async (description: string, selectedPortionSize: PortionSize): Promise<MealReport | null> => {
        try {
            const endpoint = scannerTabMode === "pantry" ? "/api/meals/analyze-pantry" : "/api/meals/analyze-preview";
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description,
                    portionSize: scannerTabMode === "pantry" ? "medium" : selectedPortionSize,
                    locale
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t.analyzeError);
            }

            const data = await response.json();
            return data.data as MealReport;
        } catch (error) {
            console.error("Error analyzing text:", error);
            alert(error instanceof Error ? error.message : t.analyzeError);
            return null;
        }
    };

    // Get coach feedback after selecting meal time
    const getCoachFeedback = async (mealReport: MealReport, mealTime: MealTime): Promise<string> => {
        try {
            const response = await fetch("/api/meals/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ report: mealReport, mealTime, locale }),
            });

            if (!response.ok) return t.defaultFeedback;

            const data = await response.json();
            return data.data?.feedback || t.defaultFeedback;
        } catch {
            return t.defaultFeedback;
        }
    };

    // Save meal to database
    const saveMeal = async (): Promise<boolean> => {
        if (!report || !selectedMealTime) return false;

        try {
            const response = await fetch("/api/meals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: report.name,
                    calories: report.calories,
                    protein: report.macros.protein,
                    carbs: report.macros.carbs,
                    fat: report.macros.fat,
                    ingredients: report.ingredients.map(i => i.name),
                    detailedIngredients: report.ingredients.map(i => ({
                        name: i.name,
                        calories: i.calories || 0,
                        safe: i.safe,
                        warning: i.alert || null,
                    })),
                    mealTime: selectedMealTime,
                    safetyStatus: report.safetyStatus,
                    coachFeedback: report.coachFeedback,
                    imageUrl: report.imageUrl,
                }),
            });

            return response.ok;
        } catch (error) {
            console.error("Error saving meal:", error);
            return false;
        }
    };

    // Save pantry items to database
    const savePantryItems = async (): Promise<boolean> => {
        if (!report) return false;

        try {
            const response = await fetch("/api/meals/pantry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ingredients: report.ingredients.map(i => ({
                        name: i.name,
                        quantity: i.quantity || null,
                        unit: i.unit || "gramos",
                        category: i.category,
                    })),
                }),
            });

            return response.ok;
        } catch (error) {
            console.error("Error saving pantry:", error);
            return false;
        }
    };

    const startCamera = useCallback(async () => {
        setStep("camera_active");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setStep("upload");
            alert(t.cameraError);
        }
    }, [t.cameraError]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStep("upload");
    }, []);

    const capturePhoto = useCallback(async () => {
        if (!videoRef.current) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Stop camera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Get base64 image
        const fullUrl = canvas.toDataURL("image/jpeg");
        const base64Image = fullUrl.split(",")[1];

        setPendingImage({ base64: base64Image, fullUrl });

        if (scannerTabMode === "pantry") {
            // Skip portion select in pantry mode
            setIsAnalyzing(true);
            const result = await analyzeImage(base64Image, "medium");
            setIsAnalyzing(false);

            if (result && result.isFood) {
                setReport({ ...result, imageUrl: fullUrl });
                setStep("edit");
            } else {
                alert(t.noFoodDetected);
                setStep("upload");
            }
        } else {
            setPortionSize("medium"); // Reset to default
            setStep("portion_select");
        }
    }, [analyzeImage, scannerTabMode, t.noFoodDetected]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convert file to base64 and go to portion select
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = (reader.result as string).split(",")[1];
            const fullUrl = reader.result as string;

            setPendingImage({ base64, fullUrl });

            if (scannerTabMode === "pantry") {
                setIsAnalyzing(true);
                const result = await analyzeImage(base64, "medium");
                setIsAnalyzing(false);

                if (result && result.isFood) {
                    setReport({ ...result, imageUrl: fullUrl });
                    setStep("edit");
                } else {
                    alert(t.noFoodDetected);
                    setStep("upload");
                }
            } else {
                setPortionSize("medium"); // Reset to default
                setStep("portion_select");
            }
        };
        reader.readAsDataURL(file);
    };

    // Handle portion size confirmation and run analysis
    const handleConfirmPortionSize = useCallback(async () => {
        if (!pendingImage && !pendingDescription) return;

        setIsAnalyzing(true);
        let result: MealReport | null = null;

        if (pendingImage) {
            result = await analyzeImage(pendingImage.base64, portionSize);
        } else if (pendingDescription) {
            result = await analyzeText(pendingDescription, portionSize);
        }

        setIsAnalyzing(false);

        if (result && result.isFood) {
            setReport(pendingImage ? { ...result, imageUrl: pendingImage.fullUrl } : result);
            setPendingImage(null);
            setPendingDescription(null);
            setStep("edit");
        } else {
            alert(pendingDescription ? t.noFoodInDescription : t.noFoodDetected);
            setPendingImage(null);
            setPendingDescription(null);
            setStep("upload");
        }
    }, [pendingImage, pendingDescription, portionSize, t.noFoodDetected, t.noFoodInDescription]);

    // Cancel portion selection
    const handleCancelPortionSelect = useCallback(() => {
        setPendingImage(null);
        setPendingDescription(null);
        setStep("upload");
    }, []);

    // Start voice input - adapts to device capabilities
    const startVoiceInput = useCallback(() => {
        const SpeechRecognitionAPI =
            (window as unknown as Record<string, unknown>).webkitSpeechRecognition ||
            (window as unknown as Record<string, unknown>).SpeechRecognition;

        if (!SpeechRecognitionAPI) {
            // Fallback to text mode if no speech recognition
            alert(t.noSpeechSupport);
            setMode("text");
            return;
        }

        // Only clear transcript if this is the first press (entering voice mode)
        if (step !== "voice_input") {
            setVoiceTranscript("");
            setInterimTranscript("");
            voiceTranscriptRef.current = "";
            interimTranscriptRef.current = "";
            setStep("voice_input");
        }

        // Stop any existing recognition before starting new one
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch { /* ignore */ }
            recognitionRef.current = null;
        }

        setIsRecording(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SpeechRecognitionAPI as any)();
        recognitionRef.current = recognition;

        recognition.lang = "es-ES";
        recognition.maxAlternatives = 1;

        // Adapt based on device capabilities
        if (deviceInfo.type === "ios") {
            // iOS Safari has limited support
            recognition.continuous = false;
            recognition.interimResults = true;
        } else if (deviceInfo.type === "android") {
            // Android Chrome has good support
            recognition.continuous = true;
            recognition.interimResults = true;
        } else {
            // Desktop - full support
            recognition.continuous = true;
            recognition.interimResults = true;
        }

        recognition.onstart = () => {
            setIsRecording(true);
        };

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

            // Show interim results in real-time
            if (interim) {
                interimTranscriptRef.current = interim;
                setInterimTranscript(interim);
            }

            // Accumulate final results
            if (final) {
                const updated = voiceTranscriptRef.current
                    ? voiceTranscriptRef.current + " " + final
                    : final;
                voiceTranscriptRef.current = updated;
                interimTranscriptRef.current = "";
                setVoiceTranscript(updated);
                setInterimTranscript("");
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsRecording(false);
            recognitionRef.current = null;

            if (event.error === "no-speech") {
                // No speech detected - that's okay, user can try again or type
            } else if (event.error === "not-allowed") {
                alert(t.micPermissionDenied);
            } else {
                // For other errors on iOS, suggest text mode
                if (deviceInfo.type === "ios") {
                    alert(t.voiceErrorIos);
                }
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
            interimTranscriptRef.current = "";
            setInterimTranscript("");
            recognitionRef.current = null;

            // On iOS, if we have transcript, auto-proceed to confirm
            // On other platforms, stay in voice_input so user can continue or confirm
            if (deviceInfo.type === "ios" && voiceTranscriptRef.current.trim()) {
                setStep("voice_confirm");
            }
        };

        // iOS-specific: auto-stop after detecting silence
        if (deviceInfo.type === "ios") {
            recognition.onspeechend = () => {
                recognition.stop();
            };
        }

        recognition.start();
    }, [deviceInfo.type, step, t.noSpeechSupport, t.micPermissionDenied, t.voiceErrorIos]);

    // Manually stop voice recording
    const stopVoiceInput = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsRecording(false);

        // Use refs for current values (avoid stale closures)
        const currentTranscript = voiceTranscriptRef.current;
        const currentInterim = interimTranscriptRef.current;

        // Add any pending interim to final transcript
        if (currentInterim.trim()) {
            const updated = currentTranscript
                ? currentTranscript + " " + currentInterim
                : currentInterim;
            voiceTranscriptRef.current = updated;
            setVoiceTranscript(updated);
        }

        interimTranscriptRef.current = "";
        setInterimTranscript("");

        // Don't auto-navigate to confirm — let user press again or click "Analizar"
    }, []);

    // Handle text mode analysis
    const handleTextAnalyze = useCallback(async () => {
        if (!textInput.trim()) return;

        if (scannerTabMode === "pantry") {
            setIsAnalyzing(true);
            const result = await analyzeText(textInput, "medium");
            setIsAnalyzing(false);

            if (result && result.isFood) {
                setReport(result);
                setStep("edit");
            } else {
                alert(t.noFoodInDescription);
                setStep("upload");
            }
            setTextInput("");
        } else {
            setPendingDescription(textInput);
            setPortionSize("medium");
            setStep("portion_select");
            setTextInput("");
        }
    }, [textInput, scannerTabMode, analyzeText, t.noFoodInDescription]);

    const handleConfirmVoice = useCallback(async () => {
        if (!voiceTranscript.trim()) return;

        if (scannerTabMode === "pantry") {
            setIsAnalyzing(true);
            const result = await analyzeText(voiceTranscript, "medium");
            setIsAnalyzing(false);

            if (result && result.isFood) {
                setReport(result);
                setStep("edit");
            } else {
                alert(t.noFoodInDescription);
                setStep("upload");
            }
            setVoiceTranscript("");
        } else {
            setPendingDescription(voiceTranscript);
            setPortionSize("medium");
            setStep("portion_select");
            setVoiceTranscript("");
        }
    }, [voiceTranscript, scannerTabMode, analyzeText, t.noFoodInDescription]);

    const handleCancelVoice = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch { /* ignore */ }
            recognitionRef.current = null;
        }
        setIsRecording(false);
        setInterimTranscript("");
        setVoiceTranscript("");
        voiceTranscriptRef.current = "";
        interimTranscriptRef.current = "";
        setStep("upload");
    }, []);

    // Edit ingredients
    const removeIngredient = (idx: number) => {
        if (!report) return;
        const newIngredients = report.ingredients.filter((_, i) => i !== idx);
        const newCalories = newIngredients.reduce((sum, ing) => sum + (ing.calories || 0), 0);
        setReport({ ...report, ingredients: newIngredients, calories: newCalories });
    };

    const addManualIngredient = () => {
        if (!newIngName.trim()) return;

        const newIng: Ingredient = {
            name: newIngName.trim(),
            safe: true,
            calories: scannerTabMode === "pantry" ? 0 : (parseInt(newIngCals) || 0),
            quantity: scannerTabMode === "pantry" ? (parseInt(newIngCals) || 0) : undefined,
            unit: scannerTabMode === "pantry" ? newIngUnit : undefined,
            category: scannerTabMode === "pantry" ? "otros" : undefined,
        };

        if (report) {
            setReport({
                ...report,
                ingredients: [...report.ingredients, newIng],
                calories: scannerTabMode === "pantry" ? report.calories : (report.calories + newIng.calories),
            });
        }

        setNewIngName("");
        setNewIngCals("");
        setNewIngUnit("gramos");
    };

    const startEditing = (idx: number, ing: Ingredient) => {
        setEditingIdx(idx);
        setEditValue({
            name: ing.name,
            quantity: ing.quantity != null ? ing.quantity.toString() : "",
            unit: ing.unit || "gramos"
        });
    };

    const saveEdit = (idx: number) => {
        if (!report) return;
        const updatedIngredients = [...report.ingredients];
        const oldCals = updatedIngredients[idx].calories || 0;
        const newCals = parseInt(editValue.quantity) || 0;

        updatedIngredients[idx] = {
            ...updatedIngredients[idx],
            name: editValue.name.trim() || updatedIngredients[idx].name,
            quantity: scannerTabMode === "pantry" ? (parseFloat(editValue.quantity) || 0) : updatedIngredients[idx].quantity,
            calories: scannerTabMode === "meal" ? newCals : updatedIngredients[idx].calories,
            unit: editValue.unit
        };

        setReport({
            ...report,
            ingredients: updatedIngredients,
            calories: scannerTabMode === "meal" ? (report.calories - oldCals + newCals) : report.calories
        });
        setEditingIdx(null);
    };

    // Proceed to time selection or finish pantry
    const handleProceedToTime = () => {
        if (scannerTabMode === "pantry") {
            handleSave(); // Direct save for pantry
        } else {
            setStep("time");
        }
    };

    // Handle meal time selection and get feedback
    const handleSelectMealTime = async (time: MealTime) => {
        if (!report) return;

        setSelectedMealTime(time);
        setAnalyzingPhase("finalizing");
        setIsAnalyzing(true);

        // Get coach feedback
        const feedback = await getCoachFeedback(report, time);
        setReport({ ...report, coachFeedback: feedback });

        setIsAnalyzing(false);
        setStep("results");
    };

    // Save meal or pantry
    const handleSave = async () => {
        setIsSaving(true);

        let success = false;
        if (scannerTabMode === "pantry") {
            success = await savePantryItems();
        } else {
            success = await saveMeal();
        }

        setIsSaving(false);

        if (success) {
            setReport(null);
            setStep("upload");
            setSelectedMealTime(null);
            setAnalyzingPhase("scanning");

            if (scannerTabMode === "pantry" && onPantryUpdated) {
                onPantryUpdated();
            } else {
                onMealSaved();
            }
        } else {
            alert(t.saveError);
        }
    };

    // Discard and reset
    const handleDiscard = () => {
        setReport(null);
        setStep("upload");
        setSelectedMealTime(null);
        setAnalyzingPhase("scanning");
    };

    // Show loading state
    if (isAnalyzing) {
        return (
            <div className="animate-fadeIn flex flex-col pb-6" role="status" aria-live="polite">
                <AnalyzingOverlay
                    imageUrl={pendingImage?.fullUrl || report?.imageUrl}
                    inputMode={mode}
                    scannerMode={scannerTabMode}
                    phase={analyzingPhase}
                />
            </div>
        );
    }

    // Full-screen camera view
    if (step === "camera_active") {
        return (
            <div className="fixed inset-0 z-[400] bg-black flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-10">
                    <button
                        onClick={stopCamera}
                        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <button
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-90 transition-transform"
                    >
                        <div className="w-16 h-16 rounded-full bg-white" />
                    </button>
                    <div className="w-12 h-12" />
                </div>
                <div className="absolute top-10 left-0 right-0 text-center">
                    <p className="text-white text-xs font-black tracking-widest uppercase bg-black/40 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm">
                        {scannerTabMode === "pantry" ? t.pantryFrameHint : t.frameYourPlate}
                    </p>
                </div>
            </div>
        );
    }

    // Portion size selection step
    if (step === "portion_select" && (pendingImage || pendingDescription)) {
        return (
            <PortionSelector
                selected={portionSize}
                onChange={setPortionSize}
                imagePreview={pendingImage?.fullUrl}
                onConfirm={handleConfirmPortionSize}
                onCancel={handleCancelPortionSelect}
            />
        );
    }

    // Voice input step - real-time recording with feedback
    if (step === "voice_input") {
        return (
            <div className="animate-fadeIn flex flex-col pb-6">
                <div className="flex flex-col items-center justify-center py-6 gap-4">
                    <ModeToggle mode={mode} onModeChange={(m) => {
                        handleCancelVoice();
                        setMode(m);
                    }} />

                    {/* Voice visualization */}
                    <div className="relative w-44 h-44 sm:w-56 sm:h-56">
                        {/* Animated rings when recording */}
                        {isRecording && (
                            <>
                                <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-20" />
                                <div className="absolute inset-4 bg-emerald-300 rounded-full animate-ping opacity-30" style={{ animationDelay: "0.3s" }} />
                            </>
                        )}
                        <div className={`relative w-full h-full bg-white rounded-[40px] sm:rounded-[56px] shadow-2xl flex items-center justify-center border-4 ${isRecording ? "border-emerald-400" : "border-white"} ring-1 ring-slate-100 transition-all`}>
                            <div className={`text-6xl transition-transform ${isRecording ? "scale-110" : "scale-100"}`}>
                                {isRecording ? "🎤" : "🎙️"}
                            </div>
                        </div>
                    </div>

                    {/* Real-time transcript display */}
                    <div className="w-full max-w-sm px-4 min-h-[60px]">
                        {(voiceTranscript || interimTranscript) ? (
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                                {voiceTranscript && (
                                    <p className="text-slate-700 font-medium text-center">
                                        {voiceTranscript}
                                    </p>
                                )}
                                {interimTranscript && isRecording && (
                                    <p className="text-emerald-500 font-medium text-center italic animate-pulse">
                                        {interimTranscript}...
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm text-center">
                                {isRecording
                                    ? (deviceInfo.type === "ios"
                                        ? t.speakNowIos
                                        : (scannerTabMode === "pantry" ? t.pantryVoiceTitle : t.speakNow))
                                    : t.pressToStart}
                            </p>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                            onPointerDown={(e) => {
                                e.preventDefault();
                                startVoiceInput();
                            }}
                            onPointerUp={(e) => {
                                e.preventDefault();
                                stopVoiceInput();
                            }}
                            onPointerLeave={(e) => {
                                // Stop if user slides finger out of button
                                if (isRecording) {
                                    stopVoiceInput();
                                }
                            }}
                            className={`w-full px-8 py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl transition-all flex items-center justify-center gap-3 select-none touch-none ${isRecording
                                ? "bg-rose-500 text-white scale-95 shadow-inner"
                                : "bg-slate-900 text-emerald-400 active:scale-95"
                                }`}
                        >
                            {isRecording ? (
                                <>
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    Soltar para Finalizar
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    Mantener para Hablar
                                </>
                            )}
                        </button>

                        {!isRecording && voiceTranscript && (
                            <button
                                onClick={handleConfirmVoice}
                                className="w-full px-8 py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                                Analizar {scannerTabMode === "pantry" ? "Alimentos" : "Plato"}
                            </button>
                        )}

                        <button
                            onClick={handleCancelVoice}
                            className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors"
                        >
                            {t.cancel}
                        </button>
                    </div>

                    {/* Hint for text mode */}
                    {!isRecording && !voiceTranscript && (
                        <p className="text-[10px] text-slate-400 text-center">
                            {t.micProblems} <button onClick={() => { handleCancelVoice(); setMode("text"); }} className="text-emerald-500 underline">{t.useTextMode}</button>
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Voice confirmation modal
    if (step === "voice_confirm") {
        return (
            <>
                <div className="animate-fadeIn flex flex-col pb-6">
                    <div className="flex flex-col items-center justify-center py-8 gap-6">
                        <ModeToggle mode={mode} onModeChange={setMode} />
                        <div className="w-44 h-44 sm:w-56 sm:h-56 bg-white rounded-[40px] sm:rounded-[56px] shadow-2xl flex items-center justify-center border-4 border-white ring-1 ring-slate-100 relative overflow-hidden">
                            <QaliaLogo className="w-16 h-16 sm:w-20 sm:h-20 opacity-20" color="#10B981" />
                        </div>
                    </div>
                </div>

                {/* Voice Confirmation Modal */}
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 animate-fadeIn">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={handleCancelVoice}
                    />
                    <div className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-8 animate-fadeInUp flex flex-col items-center text-center gap-6">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl">
                            🎙️
                        </div>
                        <div className="space-y-2 w-full">
                            <h3 className="text-lg font-black text-slate-800 tracking-tighter">{t.didYouMean}</h3>
                            {isEditingTranscript ? (
                                <input
                                    autoFocus
                                    className="w-full p-4 bg-slate-50 border-2 border-emerald-100 rounded-2xl outline-none font-bold text-slate-700 text-center"
                                    value={voiceTranscript}
                                    onChange={(e) => setVoiceTranscript(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleConfirmVoice()}
                                />
                            ) : (
                                <p className="text-xl font-bold text-emerald-600 italic">&quot;{voiceTranscript}&quot;</p>
                            )}
                        </div>
                        <div className="w-full flex flex-col gap-3">
                            <button
                                onClick={handleConfirmVoice}
                                className="w-full py-4 bg-[#10B981] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                            >
                                {t.yesAnalyze}
                            </button>
                            <button
                                onClick={() => setIsEditingTranscript(true)}
                                className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
                            >
                                {t.noCorrectText}
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Edit step - show ingredients
    if (step === "edit" && report) {
        return (
            <div className="w-full mx-auto space-y-4 sm:space-y-6 pt-4 sm:pt-6 pb-32 px-4 sm:px-6 animate-fadeIn">
                <div className="text-center space-y-1">
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-800 tracking-tight">{t.agreeWithAnalysis}</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500">{scannerTabMode === "pantry" ? t.pantryEditHint : t.editHint}</p>
                    {scannerTabMode !== "pantry" && (
                        <div className="flex justify-center mt-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total</span>
                                <span className="text-sm font-black text-emerald-700">{report.calories} kcal</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    {/* Ingredients list */}
                    <div className="space-y-3">
                        {report.ingredients.map((ing, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center justify-between p-3 sm:p-4 rounded-3xl group transition-all ${ing.safe
                                    ? "bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100"
                                    : "bg-rose-50 border border-rose-200"
                                    }`}
                            >
                                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    {scannerTabMode === "pantry" ? (
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-sm flex-shrink-0 ${CATEGORY_COLORS[ing.category || "otros"]}`}>
                                            {CATEGORY_ICONS[ing.category || "otros"]}
                                        </div>
                                    ) : (
                                        <span
                                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ing.safe ? "bg-emerald-500 ring-4 ring-emerald-50" : "bg-rose-500 ring-4 ring-rose-50"
                                                }`}
                                        />
                                    )}
                                    <div className="flex flex-col min-w-0 pr-2 flex-1">
                                        {editingIdx === idx ? (
                                            <div className="space-y-2 animate-fadeIn">
                                                {/* Editable name */}
                                                <input
                                                    type="text"
                                                    value={editValue.name}
                                                    onChange={(e) => setEditValue({ ...editValue, name: e.target.value })}
                                                    autoFocus
                                                    className="w-full bg-white border border-emerald-500 rounded-lg px-2.5 py-1.5 text-sm font-black text-slate-800 outline-none"
                                                />
                                                {/* Category label (read-only while editing) */}
                                                {scannerTabMode === "pantry" && ing.category && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                                                        {dictionary.dashboard.home.pantryCategories[ing.category as keyof typeof dictionary.dashboard.home.pantryCategories] || ing.category}
                                                    </span>
                                                )}
                                                {/* Editable quantity + unit + save */}
                                                <div className="flex items-center gap-1.5">
                                                    <input
                                                        type="number"
                                                        value={editValue.quantity}
                                                        onChange={(e) => setEditValue({ ...editValue, quantity: e.target.value })}
                                                        placeholder="0"
                                                        className="w-16 bg-white border border-emerald-500 rounded-lg px-2 py-1 text-[10px] font-black text-emerald-700 outline-none"
                                                    />
                                                    {scannerTabMode === "pantry" ? (
                                                        <select
                                                            value={editValue.unit}
                                                            onChange={(e) => setEditValue({ ...editValue, unit: e.target.value })}
                                                            className="bg-white border border-emerald-500 rounded-lg px-2 py-1 text-[9px] font-black text-emerald-700 outline-none cursor-pointer"
                                                        >
                                                            <option value="gramos">g</option>
                                                            <option value="unidades">un</option>
                                                            <option value="litros">L</option>
                                                            <option value="ml">ml</option>
                                                            <option value="kg">kg</option>
                                                            <option value="paquete">paq</option>
                                                        </select>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">kcal</span>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); saveEdit(idx); }}
                                                        className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingIdx(null); }}
                                                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div
                                                    onClick={() => startEditing(idx, ing)}
                                                    className="cursor-pointer group/name"
                                                >
                                                    <span
                                                        className={`text-sm sm:text-base font-black truncate block group-hover/name:text-emerald-600 transition-colors ${ing.safe ? "text-slate-800" : "text-rose-700"}`}
                                                    >
                                                        {ing.name}
                                                    </span>
                                                </div>
                                                {ing.alert && (
                                                    <span className="text-[10px] font-bold text-rose-500 line-clamp-1">{ing.alert}</span>
                                                )}
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                                    {scannerTabMode === "pantry" && ing.category && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                                                            {dictionary.dashboard.home.pantryCategories[ing.category as keyof typeof dictionary.dashboard.home.pantryCategories] || ing.category}
                                                        </span>
                                                    )}
                                                    {scannerTabMode === "pantry" && (ing.category) && <span className="hidden sm:inline text-slate-200 text-[10px]">•</span>}
                                                    <div
                                                        onClick={() => startEditing(idx, ing)}
                                                        className={`group/edit flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer hover:bg-emerald-50`}
                                                    >
                                                        <span className="text-[10px] text-emerald-600 font-black uppercase tracking-tight">
                                                            {scannerTabMode === "pantry"
                                                                ? (ing.quantity || ing.unit ? `${ing.quantity ?? ""}${ing.unit ? (ing.quantity ? ' ' : '') + ing.unit : 'g'}` : t.pendingEstimate)
                                                                : (ing.calories !== undefined ? `${ing.calories} kcal` : t.pendingEstimate)
                                                            }
                                                        </span>
                                                        <svg className="w-3 h-3 text-emerald-300 opacity-0 group-hover/edit:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeIngredient(idx)}
                                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                    title="Eliminar"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Trigger for manual addition */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full p-6 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100 group hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex flex-col items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{t.addExtra}</p>
                            <p className="text-[9px] text-slate-300 mt-0.5">{scannerTabMode === "pantry" ? "Ingrediente adicional" : "Alimento omitido"}</p>
                        </div>
                    </button>

                    <button
                        onClick={handleProceedToTime}
                        className="w-full py-6 bg-slate-900 text-emerald-400 rounded-[30px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        {scannerTabMode === "pantry" ? t.pantryConfirm : t.confirmMeal}
                    </button>
                </div>

                {/* Add manual modal */}
                <AccessibleModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    title={t.addExtra}
                    showCloseButton
                >
                    <div className="p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{t.addExtra}</h3>
                            <p className="text-sm text-slate-500">Introduce los detalles del alimento manual</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.foodPlaceholder}</label>
                                <input
                                    value={newIngName}
                                    onChange={e => setNewIngName(e.target.value)}
                                    placeholder="Ej: Aceite de oliva, Huevo, etc."
                                    autoFocus
                                    className="w-full bg-slate-50 px-6 py-4 rounded-2xl text-sm font-bold text-slate-900 outline-none border border-transparent focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-300"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{scannerTabMode === "pantry" ? "Cantidad" : "Calorías"}</label>
                                    <div className="relative group/input">
                                        <input
                                            type="number"
                                            value={newIngCals}
                                            onChange={e => setNewIngCals(e.target.value)}
                                            placeholder={scannerTabMode === "pantry" ? "0" : "0"}
                                            className="w-full bg-slate-50 px-6 py-4 rounded-2xl text-sm font-bold text-slate-900 outline-none border border-transparent focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-300"
                                        />
                                        {scannerTabMode !== "pantry" && !newIngCals && (
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase pointer-events-none tracking-tighter">opt</span>
                                        )}
                                    </div>
                                </div>

                                {scannerTabMode === "pantry" && (
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad</label>
                                        <select
                                            className="w-full bg-slate-50 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-900 border border-transparent focus:border-emerald-500 focus:bg-white outline-none cursor-pointer transition-all appearance-none text-center"
                                            value={newIngUnit}
                                            onChange={(e) => setNewIngUnit(e.target.value)}
                                        >
                                            <option value="gramos">g</option>
                                            <option value="unidades">un</option>
                                            <option value="ml">ml</option>
                                            <option value="kg">kg</option>
                                            <option value="paquete">paq</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:text-slate-600 transition-colors"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={() => {
                                    addManualIngredient();
                                    setIsAddModalOpen(false);
                                }}
                                disabled={!newIngName}
                                className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 disabled:bg-slate-200 disabled:shadow-none transition-all active:scale-95"
                            >
                                {t.addButton}
                            </button>
                        </div>
                    </div>
                </AccessibleModal>
            </div>
        );
    }

    // Time selection step
    if (step === "time") {
        return (
            <div className="max-w-xl mx-auto space-y-8 py-8 px-4 text-center animate-fadeIn">
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{t.mealTimeTitle}</h3>
                <p className="text-sm text-slate-400 mt-2">{t.mealTimeHint}</p>
                <div className="grid grid-cols-2 gap-4">
                    {(["breakfast", "lunch", "dinner", "snack"] as MealTime[]).map(timeKey => (
                        <button
                            key={timeKey}
                            onClick={() => handleSelectMealTime(timeKey)}
                            className="aspect-square bg-white border border-slate-100 rounded-[40px] font-black hover:border-emerald-500 hover:bg-emerald-50 transition-all flex flex-col items-center justify-center gap-2 group shadow-sm"
                        >
                            <span className="text-4xl group-hover:scale-110 transition-transform">
                                {MEAL_TIME_EMOJIS[timeKey]}
                            </span>
                            <span className="uppercase text-[10px] tracking-widest text-slate-400 group-hover:text-emerald-600 transition-colors">
                                {t[timeKey]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Results step
    if (step === "results" && report) {
        return (
            <div className="w-full mx-auto space-y-4 sm:space-y-6 pt-4 sm:pt-6 pb-32 px-4 sm:px-6 animate-fadeIn">
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[24px] sm:rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm space-y-4 sm:space-y-6 md:space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">{report.name}</h3>
                        <div
                            className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-black tracking-widest text-white flex-shrink-0 ${report.safetyStatus === "safe" ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                        >
                            {report.safetyStatus === "safe" ? t.safeLabel : t.alertLabel}
                        </div>
                    </div>

                    {/* Calories - only show for meals */}
                    {scannerTabMode === "meal" && (
                        <div className="flex justify-between items-end border-b border-slate-50 pb-4 sm:pb-6">
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{t.estimatedEnergy}</span>
                            <span className="font-black text-emerald-600 text-2xl sm:text-3xl md:text-4xl tracking-tighter">
                                {report.calories} <span className="text-[8px] sm:text-[10px] text-slate-300 uppercase">KCAL</span>
                            </span>
                        </div>
                    )}

                    {/* Portion Estimate */}
                    {report.portionEstimate && (
                        <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                            <span className="text-xl sm:text-2xl">⚖️</span>
                            <div>
                                <p className="text-base sm:text-lg font-black text-slate-700">
                                    ~{report.portionEstimate.totalGrams}g
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-slate-400">
                                    {t.estimatedPortion}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Macros - only show for meals */}
                    {scannerTabMode === "meal" && (
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="bg-blue-50 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                                <p className="text-base sm:text-xl font-black text-blue-600">{report.macros.protein}g</p>
                                <p className="text-[8px] sm:text-[9px] font-bold text-blue-400 uppercase">{dictionary.dashboard.macros.protein}</p>
                            </div>
                            <div className="bg-amber-50 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                                <p className="text-base sm:text-xl font-black text-amber-600">{report.macros.carbs}g</p>
                                <p className="text-[8px] sm:text-[9px] font-bold text-amber-400 uppercase">{dictionary.dashboard.macros.carbs}</p>
                            </div>
                            <div className="bg-rose-50 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-center">
                                <p className="text-base sm:text-xl font-black text-rose-600">{report.macros.fat}g</p>
                                <p className="text-[8px] sm:text-[9px] font-bold text-rose-400 uppercase">{dictionary.dashboard.macros.fat}</p>
                            </div>
                        </div>
                    )}

                    {/* Ingredients with alerts */}
                    <div className="space-y-2 sm:space-y-3">
                        <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {t.ingredients} ({report.ingredients.length})
                        </h4>
                        <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto no-scrollbar">
                            {report.ingredients.map((ing, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border ${ing.safe
                                        ? "bg-slate-50 border-slate-100"
                                        : "bg-rose-50 border-rose-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${ing.safe ? "bg-emerald-500" : "bg-rose-500"}`} />
                                        <div className="min-w-0 flex-1">
                                            <span className={`text-xs sm:text-sm font-bold truncate block ${ing.safe ? "text-slate-700" : "text-rose-700"}`}>
                                                {ing.name}
                                            </span>
                                            {ing.alert && (
                                                <p className="text-[9px] sm:text-[10px] text-rose-500 truncate">{ing.alert}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 flex-shrink-0 ml-2">{ing.calories} kcal</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Coach feedback */}
                    {report.coachFeedback && (
                        <div className="p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl sm:rounded-[32px] border border-emerald-100 shadow-sm space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg sm:text-2xl">💡</span>
                                <span className="text-[10px] sm:text-xs font-black text-emerald-700 uppercase tracking-widest">{t.kiliTip}</span>
                            </div>
                            <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                                {report.coachFeedback}
                            </p>
                        </div>
                    )}

                    {/* Save actions */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 py-2">
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                                {t.pendingSave}
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black shadow-2xl active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-xs animate-pulse hover:animate-none relative overflow-hidden group"
                        >
                            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                            {isSaving ? t.savingButton : t.saveButton}
                        </button>
                        <button
                            onClick={handleDiscard}
                            className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors"
                        >
                            {t.discardButton}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Intro selection step
    if (step === "intro") {
        return (
            <div className="max-w-xl mx-auto space-y-8 py-12 px-6 animate-fadeIn">
                <div className="text-center space-y-3">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
                        {t.introTitle}
                    </h3>
                    <p className="text-sm text-slate-400">
                        {t.introSubtitle}
                    </p>
                </div>

                <div className="grid gap-4">
                    <button
                        onClick={() => {
                            setScannerTabMode("meal");
                            setStep("upload");
                        }}
                        className="group relative overflow-hidden bg-white p-8 rounded-[40px] border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-sm font-black text-emerald-600 uppercase tracking-widest block">
                                    {t.logMealOption}
                                </span>
                                <p className="text-xs text-slate-400 font-medium whitespace-pre-wrap max-w-[200px]">
                                    {t.logMealDescription}
                                </p>
                            </div>
                            <span className="text-4xl group-hover:scale-110 transition-transform">🍳</span>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            setScannerTabMode("pantry");
                            setStep("upload");
                        }}
                        className="group relative overflow-hidden bg-white p-8 rounded-[40px] border-2 border-slate-100 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-left shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-sm font-black text-amber-600 uppercase tracking-widest block">
                                    {t.updatePantryOption}
                                </span>
                                <p className="text-xs text-slate-400 font-medium whitespace-pre-wrap max-w-[200px]">
                                    {t.updatePantryDescription}
                                </p>
                            </div>
                            <span className="text-4xl group-hover:scale-110 transition-transform">📦</span>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    // Default upload state
    return (
        <div className="animate-fadeIn flex flex-col pb-6">
            <div className="flex flex-col items-center justify-center py-8 gap-6">
                <ModeToggle mode={mode} onModeChange={setMode} />

                {/* Central logo */}
                <div className="w-44 h-44 sm:w-56 sm:h-56 bg-white rounded-[40px] sm:rounded-[56px] shadow-2xl flex items-center justify-center border-4 border-white ring-1 ring-slate-100 relative overflow-hidden">
                    <QaliaLogo
                        className={`w-16 h-16 sm:w-20 sm:h-20 transition-all ${isRecording ? "opacity-100 scale-110" : "opacity-20"}`}
                        color="#10B981"
                    />
                </div>

                {/* Mode-specific actions */}
                {mode === "camera" && (
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={startCamera}
                            className="w-full px-8 py-5 bg-slate-900 text-emerald-400 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {scannerTabMode === "pantry" ? t.pantryTakePhoto : t.takePhoto}
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-8 py-5 bg-white text-slate-700 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg border border-slate-200 active:scale-95 transition-all flex items-center justify-center gap-3 hover:border-emerald-300 hover:text-emerald-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {t.chooseGallery}
                        </button>
                        <p className="text-[10px] text-slate-400 text-center">
                            {t.imageFormats}
                        </p>
                    </div>
                )}

                {mode === "voice" && (
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <button
                            onClick={startVoiceInput}
                            className="w-full px-8 py-5 bg-slate-900 text-emerald-400 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            {scannerTabMode === "pantry" ? t.pantryVoiceTitle : t.voiceTitle}
                        </button>
                        <p className="text-[10px] text-slate-400 text-center">
                            {t.voiceDescription}
                        </p>
                    </div>
                )}

                {mode === "text" && (
                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 focus-within:border-emerald-400 transition-colors p-4">
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder={scannerTabMode === "pantry" ? t.pantryTextPlaceholder : t.textPlaceholder}
                                className="w-full h-32 resize-none outline-none text-slate-800 placeholder:text-slate-400 text-sm leading-relaxed"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={handleTextAnalyze}
                            disabled={!textInput.trim()}
                            className="w-full px-8 py-5 bg-slate-900 text-emerald-400 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {scannerTabMode === "pantry" ? t.pantryConfirm : t.analyzeButton}
                        </button>
                        <p className="text-[10px] text-slate-400 text-center">
                            {t.textHint}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
