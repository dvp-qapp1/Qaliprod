"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QaliaLogo } from "@/components/ui/QaliaLogo";
import { useDictionary, useLocale } from "@/contexts/DictionaryContext";
import { LanguageSwitcherCompact } from "@/components/i18n/LanguageSwitcher";

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

export default function LoginPage() {
    const { dictionary: dict } = useDictionary();
    const locale = useLocale();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error, data } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
            return;
        }

        // Check if user has completed onboarding
        if (data.user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("onboarding_completed")
                .eq("user_id", data.user.id)
                .single();

            if (!profile?.onboarding_completed) {
                router.push(`/${locale}/onboarding`);
                router.refresh();
                return;
            }
        }

        router.push(`/${locale}/dashboard`);
        router.refresh();
    }

    async function handleGoogleLogin() {
        setIsLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/${locale}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 overflow-hidden relative">
            <Link
                href={`/${locale}`}
                className="absolute top-8 left-8 p-3 rounded-full bg-white shadow-lg hover:scale-110 transition-transform z-50"
            >
                <svg
                    className="w-6 h-6 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </Link>

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center animate-fadeInUp">
                {/* Logo Container */}
                <div className="w-24 h-24 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mb-8 border border-white/50">
                    <QaliaLogo className="w-16 h-16" color="#10B981" />
                </div>

                <h1 className="text-5xl font-black text-slate-800 mb-3 tracking-tighter">
                    {dict.login.title}
                </h1>
                <p className="text-slate-600 text-center mb-10 font-medium px-6">
                    {dict.login.subtitle}
                </p>

                {/* Error Message */}
                {error && (
                    <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Google Sign In */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <GoogleIcon />
                    <span className="text-gray-700 font-medium">
                        {dict.login.googleButton}
                    </span>
                </button>

                <div className="flex items-center gap-4 my-6 w-full">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-gray-600 text-sm">{dict.common.or}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Email Login Form */}
                <form onSubmit={handleLogin} className="w-full space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {dict.login.emailLabel}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder={locale === "es" ? "tu@email.com" : "you@email.com"}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {dict.login.passwordLabel}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-emerald-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                {dict.login.loadingButton}
                            </span>
                        ) : (
                            dict.login.submitButton
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-700 text-sm">
                    {dict.login.noAccount}{" "}
                    <Link
                        href={`/${locale}/signup`}
                        className="text-emerald-600 font-semibold hover:underline"
                    >
                        {dict.login.createAccount}
                    </Link>
                </p>
            </div>
        </div>
    );
}
