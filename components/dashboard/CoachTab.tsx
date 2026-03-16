"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { type ChatMessage, type CoachMode, type Recipe, type GeneratedRecipe } from "@/types/dashboard.types";
import { useDictionary } from "@/contexts/DictionaryContext";

// SpeechRecognition types for Web Speech API
interface SpeechRecognitionResult {
    isFinal: boolean;
    0: { transcript: string; confidence: number };
    length: number;
}

interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    }
}

interface CoachTabProps {
    messages: ChatMessage[];
    isWaiting: boolean;
    onSendMessage: (message: string, recipeContext?: Recipe) => void;
    // New props for chef mode
    mode?: CoachMode;
    chefRecipe?: Recipe | null;
    recipesHistory?: GeneratedRecipe[];
    onModeChange?: (mode: CoachMode) => void;
    onRecipeChange?: (recipe: Recipe) => void;
}

// Mode toggle component
function ModeToggle({
    mode,
    onModeChange,
    t,
}: {
    mode: CoachMode;
    onModeChange: (mode: CoachMode) => void;
    t: { modeCoach: string; modeChef: string };
}) {
    return (
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <button
                type="button"
                onClick={() => onModeChange("coach")}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === "coach"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                    }`}
            >
                🧠 {t.modeCoach}
            </button>
            <button
                type="button"
                onClick={() => onModeChange("chef")}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === "chef"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                    }`}
            >
                👨‍🍳 {t.modeChef}
            </button>
        </div>
    );
}

// Image modal for full-screen view
interface ImageModalProps {
    src: string;
    alt: string;
    onClose: () => void;
}

function ImageModal({ src, alt, onClose }: ImageModalProps) {
    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={onClose}
        >
            <button
                type="button"
                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
                onClick={onClose}
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="relative max-w-5xl w-full h-full flex items-center justify-center p-4">
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scaleIn"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}

// Recipe preview for chef mode
function RecipePreview({
    recipe,
    recipesHistory = [],
    onRecipeChange,
    t,
}: {
    recipe: Recipe;
    recipesHistory?: GeneratedRecipe[];
    onRecipeChange?: (recipe: Recipe) => void;
    t: { ingredientsTitle: string; instructionsTitle: string };
}) {
    const [showIngredients, setShowIngredients] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showRecipeSwitcher, setShowRecipeSwitcher] = useState(false);

    // Convert GeneratedRecipe to Recipe for switching
    const handleSwitch = (genRecipe: GeneratedRecipe) => {
        if (onRecipeChange) {
            onRecipeChange({
                id: genRecipe.id,
                title: genRecipe.title,
                calories: genRecipe.calories,
                image: genRecipe.image_url || "",
                ingredients: genRecipe.ingredients,
                instructions: genRecipe.instructions || [],
                description: genRecipe.description,
            });
        }
        setShowRecipeSwitcher(false);
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col max-h-[50vh]">
                {/* Hero Image - Compact and clickable */}
                <div
                    className="relative flex-shrink-0 h-28 w-full cursor-pointer group overflow-hidden"
                    onClick={() => setShowImageModal(true)}
                >
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* View full size indicator on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/20">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                        </div>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="text-base font-black text-white leading-tight line-clamp-1">
                                {recipe.title}
                            </h3>
                            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black mt-0.5 shadow-sm">
                                🔥 {recipe.calories} kcal
                            </span>
                        </div>

                        {recipesHistory.length > 1 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowRecipeSwitcher(!showRecipeSwitcher);
                                }}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-white/20 transition-all active:scale-95"
                            >
                                {showRecipeSwitcher ? "Cerrar" : "Cambiar"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Recipe Switcher Overlay */}
                {showRecipeSwitcher && (
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 animate-fadeIn no-scrollbar border-b border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                            Selecciona otra receta del historial
                        </p>
                        {recipesHistory
                            .filter(r => r.id !== recipe.id)
                            .map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => handleSwitch(r)}
                                    className="w-full flex items-center gap-3 p-2 bg-white rounded-xl text-left hover:border-emerald-200 border border-transparent transition-all shadow-sm"
                                >
                                    {r.image_url && (
                                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                            <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">{r.title}</p>
                                        <p className="text-[10px] text-slate-500">{r.calories} kcal</p>
                                    </div>
                                </button>
                            ))}
                    </div>
                )}

                {/* Collapsible Sections - Scrollable content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
                    {/* Ingredients */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowIngredients(!showIngredients);
                            if (!showIngredients) setShowInstructions(false);
                        }}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl text-left hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                            🛒 {t.ingredientsTitle}
                        </span>
                        <svg
                            className={`w-4 h-4 text-slate-400 transition-transform ${showIngredients ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showIngredients && (
                        <div className="px-3 py-2 space-y-1.5 animate-fadeIn">
                            {recipe.ingredients.map((ing, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                    <span className="text-emerald-500 mt-1">•</span>
                                    <span className="leading-snug">{ing}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Instructions */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowInstructions(!showInstructions);
                            if (!showInstructions) setShowIngredients(false);
                        }}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl text-left hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                            👨‍🍳 {t.instructionsTitle}
                        </span>
                        <svg
                            className={`w-4 h-4 text-slate-400 transition-transform ${showInstructions ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showInstructions && (
                        <div className="px-3 py-2 space-y-3 animate-fadeIn">
                            {recipe.instructions.map((step, i) => (
                                <div key={i} className="flex gap-3 text-sm text-slate-600">
                                    <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-black">
                                        {i + 1}
                                    </span>
                                    <span className="leading-snug pt-0.5">{step}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Full-screen Image Modal */}
            {showImageModal && (
                <ImageModal
                    src={recipe.image}
                    alt={recipe.title}
                    onClose={() => setShowImageModal(false)}
                />
            )}
        </>
    );
}

// Empty state when no messages
function EmptyChat({ t, isChef }: { t: { title: string; subtitle: string; chefTitle: string; chefSubtitle: string }; isChef: boolean }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center py-16 gap-4">
            <span className="text-5xl animate-bounce">{isChef ? "👨‍🍳" : "👋"}</span>
            <p className="text-slate-900 font-black text-lg">{isChef ? t.chefTitle : t.title}</p>
            <p className="text-slate-400 font-medium text-sm">
                {isChef ? t.chefSubtitle : t.subtitle}
            </p>
        </div>
    );
}

// Parse basic markdown to React elements
function parseMarkdown(text: string): React.ReactNode {
    const lines = text.split('\n');

    const parseLine = (line: string, index: number): React.ReactNode => {
        const parseInline = (str: string): React.ReactNode[] => {
            const parts: React.ReactNode[] = [];
            let remaining = str;
            let key = 0;

            const boldRegex = /\*\*(.+?)\*\*/g;
            const italicRegex = /\*([^*]+)\*/g;

            let lastIndex = 0;
            let match;
            const boldMatches: Array<{ start: number; end: number; content: string }> = [];

            while ((match = boldRegex.exec(str)) !== null) {
                boldMatches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    content: match[1]
                });
            }

            if (boldMatches.length === 0) {
                remaining = str;
                lastIndex = 0;
                while ((match = italicRegex.exec(remaining)) !== null) {
                    if (match.index > lastIndex) {
                        parts.push(remaining.slice(lastIndex, match.index));
                    }
                    parts.push(<em key={`i-${key++}`} className="italic">{match[1]}</em>);
                    lastIndex = match.index + match[0].length;
                }
                if (lastIndex < remaining.length) {
                    parts.push(remaining.slice(lastIndex));
                }
                return parts.length > 0 ? parts : [str];
            }

            for (const boldMatch of boldMatches) {
                if (boldMatch.start > lastIndex) {
                    parts.push(str.slice(lastIndex, boldMatch.start));
                }
                parts.push(<strong key={`b-${key++}`} className="font-bold">{boldMatch.content}</strong>);
                lastIndex = boldMatch.end;
            }
            if (lastIndex < str.length) {
                parts.push(str.slice(lastIndex));
            }

            return parts;
        };

        const numberedListMatch = line.match(/^(\d+)\.\s+(.+)$/);
        if (numberedListMatch) {
            return (
                <div key={index} className="flex gap-2 pl-1 mb-1">
                    <span className="text-emerald-600 font-bold shrink-0">{numberedListMatch[1]}.</span>
                    <span>{parseInline(numberedListMatch[2])}</span>
                </div>
            );
        }

        if (line.startsWith('- ') || line.startsWith('• ')) {
            return (
                <div key={index} className="flex gap-2 pl-1 mb-1">
                    <span className="text-emerald-500">•</span>
                    <span>{parseInline(line.slice(2))}</span>
                </div>
            );
        }

        if (line.trim() === '') {
            return <div key={index} className="h-2" />;
        }

        return <div key={index}>{parseInline(line)}</div>;
    };

    return lines.map((line, i) => parseLine(line, i));
}

// Single message bubble - memoized
const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[85%] p-4 rounded-[22px] text-sm font-medium shadow-sm ${isUser
                    ? "bg-slate-900 text-white rounded-tr-none"
                    : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                    }`}
            >
                <div className="kili-response-content">
                    {isUser ? message.content : parseMarkdown(message.content)}
                </div>
            </div>
        </div>
    );
});

// Typing indicator
function TypingIndicator() {
    return (
        <div className="flex items-center gap-2 px-2">
            <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
            </div>
        </div>
    );
}

// Input bar with suggestions and voice input
function ChatInput({
    onSend,
    t,
    locale,
    isChef,
}: {
    onSend: (msg: string) => void;
    t: {
        placeholder: string;
        suggestion1: string;
        suggestion2: string;
        suggestion3: string;
        chefPlaceholder: string;
        chefSuggestion1: string;
        chefSuggestion2: string;
        chefSuggestion3: string;
    };
    locale: string;
    isChef: boolean;
}) {
    const [inputValue, setInputValue] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

    const suggestions = isChef
        ? [
            { icon: "🔄", text: t.chefSuggestion1 },
            { icon: "✅", text: t.chefSuggestion2 },
            { icon: "📋", text: t.chefSuggestion3 },
        ]
        : [
            { icon: "💡", text: t.suggestion1 },
            { icon: "📊", text: t.suggestion2 },
            { icon: "🍽️", text: t.suggestion3 },
        ];

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognitionAPI) {
                const recognition = new SpeechRecognitionAPI();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = locale === "es" ? 'es-ES' : 'en-US';

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let finalTranscript = '';
                    let interimTranscript = '';

                    for (let i = 0; i < event.results.length; i++) {
                        const result = event.results[i];
                        if (result.isFinal) {
                            finalTranscript += result[0].transcript;
                        } else {
                            interimTranscript += result[0].transcript;
                        }
                    }

                    setInputValue(finalTranscript + interimTranscript);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [locale]);

    const toggleVoiceInput = useCallback(() => {
        if (!recognitionRef.current) {
            const msg = locale === "es"
                ? 'Tu navegador no soporta reconocimiento de voz.'
                : 'Your browser does not support voice recognition.';
            alert(msg);
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setInputValue("");
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isListening, locale]);

    const handleSubmit = useCallback(() => {
        if (!inputValue.trim()) return;
        onSend(inputValue.trim());
        setInputValue("");
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [inputValue, onSend, isListening]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        },
        [handleSubmit]
    );

    const listeningText = locale === "es" ? "🎤 Escuchando..." : "🎤 Listening...";
    const placeholder = isChef ? t.chefPlaceholder : t.placeholder;

    return (
        <div className="shrink-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 p-3 pb-[calc(0.5rem+var(--bottom-nav-height))] md:pb-6 z-[120]">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
                {/* Suggestions */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {suggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => onSend(suggestion.text)}
                            className={`shrink-0 px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform ${isChef
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-700"
                                }`}
                        >
                            {suggestion.icon} {suggestion.text}
                        </button>
                    ))}
                </div>

                {/* Input */}
                <div className="relative">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? listeningText : placeholder}
                        className={`w-full bg-slate-100 border-none p-4 rounded-[22px] outline-none font-medium text-sm pr-28 text-slate-900 placeholder:text-slate-400 ${isListening ? "ring-2 ring-emerald-500 bg-emerald-50 text-emerald-900" : ""
                            }`}
                    />
                    <button
                        onClick={toggleVoiceInput}
                        className={`absolute right-14 top-2 bottom-2 w-10 flex items-center justify-center transition-all ${isListening
                            ? "text-white bg-emerald-500 rounded-xl animate-pulse"
                            : "text-slate-400 hover:text-emerald-500"
                            }`}
                        aria-label={isListening
                            ? (locale === "es" ? "Detener grabación" : "Stop recording")
                            : (locale === "es" ? "Iniciar grabación de voz" : "Start voice recording")
                        }
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="absolute right-2 top-2 bottom-2 w-12 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export function CoachTab({
    messages,
    isWaiting,
    onSendMessage,
    mode = "coach",
    chefRecipe = null,
    recipesHistory = [],
    onModeChange,
    onRecipeChange,
}: CoachTabProps) {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { dictionary, locale } = useDictionary();
    const t = dictionary.dashboard.coach;

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isWaiting]);

    const handleSend = useCallback((message: string) => {
        // If in chef mode with a recipe, pass the recipe context
        if (mode === "chef" && chefRecipe) {
            onSendMessage(message, chefRecipe);
        } else {
            onSendMessage(message);
        }
    }, [mode, chefRecipe, onSendMessage]);

    const handleModeChange = useCallback((newMode: CoachMode) => {
        if (onModeChange) {
            onModeChange(newMode);
        }
    }, [onModeChange]);

    const isChef = mode === "chef";
    const [isRecipeCollapsed, setIsRecipeCollapsed] = useState(false);

    return (
        <div className="flex-1 flex flex-col animate-fadeIn overflow-hidden">
            {/* Mode Toggle */}
            {onModeChange && (
                <div className="shrink-0 p-3 sm:p-4 md:px-10">
                    <ModeToggle
                        mode={mode}
                        onModeChange={handleModeChange}
                        t={{ modeCoach: t.modeCoach, modeChef: t.modeChef }}
                    />
                </div>
            )}

            {/* Recipe preview - Collapsible at top in chef mode */}
            {isChef && chefRecipe && (
                <div className="shrink-0 px-3 sm:px-4 md:px-10 pb-2">
                    <button
                        type="button"
                        onClick={() => setIsRecipeCollapsed(prev => !prev)}
                        className="w-full flex items-center justify-between py-2 px-1 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors mb-1"
                    >
                        <span className="flex items-center gap-1.5">
                            🍽️ {chefRecipe.title}
                        </span>
                        <span className="flex items-center gap-1">
                            {isRecipeCollapsed ? t.showRecipe : t.hideRecipe}
                            <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isRecipeCollapsed ? '' : 'rotate-180'}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </button>
                    {!isRecipeCollapsed && (
                        <RecipePreview
                            recipe={chefRecipe}
                            recipesHistory={recipesHistory}
                            onRecipeChange={onRecipeChange}
                            t={{ ingredientsTitle: t.ingredientsTitle, instructionsTitle: t.instructionsTitle }}
                        />
                    )}
                </div>
            )}

            {/* Messages area - scrollable, takes remaining space */}
            <div className="flex-1 overflow-y-auto space-y-4 p-3 sm:p-4 md:px-10 no-scrollbar">
                {messages.length === 0 && (
                    <EmptyChat
                        t={{
                            title: t.title,
                            subtitle: t.subtitle,
                            chefTitle: t.chefTitle,
                            chefSubtitle: t.chefSubtitle
                        }}
                        isChef={isChef && !!chefRecipe}
                    />
                )}
                {messages.map((message) => (
                    <div key={message.id} className="chat-message-optimized">
                        <MessageBubble message={message} />
                    </div>
                ))}
                {isWaiting && <TypingIndicator />}
                <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <ChatInput
                onSend={handleSend}
                t={{
                    placeholder: t.placeholder,
                    suggestion1: t.suggestion1,
                    suggestion2: t.suggestion2,
                    suggestion3: t.suggestion3,
                    chefPlaceholder: t.chefPlaceholder,
                    chefSuggestion1: t.chefSuggestion1,
                    chefSuggestion2: t.chefSuggestion2,
                    chefSuggestion3: t.chefSuggestion3,
                }}
                locale={locale}
                isChef={isChef && !!chefRecipe}
            />
        </div>
    );
}
