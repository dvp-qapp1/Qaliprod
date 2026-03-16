import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { QaliaLogo } from "@/components/ui/QaliaLogo";
import { LanguageSwitcher, LanguageSwitcherCompact } from "@/components/i18n/LanguageSwitcher";
import { getDictionary } from "@/modules/cores/i18n/src/services/dictionary.service";
import { locales, defaultLocale, type Locale } from "@/modules/cores/i18n/src/config/locales";
import type { LangPageProps } from "@/modules/cores/i18n/src/interfaces/i18n.interface";

export default async function LandingPage({ params }: LangPageProps) {
    const { lang: langParam } = await params;
    // Validate locale, fallback to default if invalid
    const lang: Locale = locales.includes(langParam as Locale)
        ? (langParam as Locale)
        : defaultLocale;
    const dict = await getDictionary(lang);

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        redirect(`/${lang}/dashboard`);
    }

    return (
        <div className="min-h-screen bg-white overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
            {/* Orbs */}
            <div className="orb orb-primary" />
            <div className="orb orb-dark" />

            {/* Navigation */}
            <nav className="px-[6%] py-6 flex justify-between items-center sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-900/5">
                <div className="flex items-center gap-2.5">
                    <QaliaLogo className="w-8 h-8 md:w-9 md:h-9" />
                    <span className="font-black text-xl md:text-2xl tracking-tighter text-slate-900 font-display">
                        QALIA
                    </span>
                </div>
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="hidden md:block">
                        <LanguageSwitcher />
                    </div>
                    <div className="md:hidden">
                        <LanguageSwitcherCompact />
                    </div>
                    <span className="hidden sm:block text-[10px] text-slate-600 tracking-[0.2em] font-black uppercase">
                        Beta V3.0
                    </span>
                    <Link
                        href={`/${lang}/login`}
                        className="btn-kinetic px-6 py-3 bg-slate-900 text-white text-xs font-black rounded-full hover:bg-emerald-600 shadow-xl shadow-slate-900/10 uppercase tracking-widest"
                    >
                        {dict.nav.login}
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <header className="px-[6%] pt-16 md:pt-32 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-[1440px] mx-auto">
                <div className="hero-content text-center lg:text-left space-y-8 animate-fadeInUp">
                    <div className="inline-block">
                        <span className="text-emerald-600 font-black text-[10px] tracking-[0.25em] bg-emerald-50 px-4 py-1.5 rounded-full uppercase">
                            {dict.landing.hero.badge}
                        </span>
                    </div>
                    <h1 className="font-black text-slate-900 leading-[1.05] tracking-tight text-4xl md:text-6xl lg:text-7xl font-display">
                        {dict.landing.hero.title}
                    </h1>
                    <p className="text-slate-600 max-w-lg mx-auto lg:mx-0 text-lg md:text-xl font-medium leading-relaxed">
                        {dict.landing.hero.description}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4">
                        <Link
                            href={`/${lang}/signup`}
                            className="btn-kinetic px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black shadow-2xl shadow-slate-900/20 text-base md:text-lg uppercase tracking-widest text-center"
                        >
                            {dict.landing.hero.cta}
                        </Link>
                        <div className="flex items-center justify-center gap-5">
                            <span className="font-black text-[11px] uppercase tracking-widest text-slate-500">
                                iOS
                            </span>
                            <span className="font-black text-[11px] uppercase tracking-widest text-slate-500">
                                Android
                            </span>
                            <span className="font-black text-[11px] uppercase tracking-widest text-slate-500">
                                Web
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative lg:mt-0 mt-10 animate-fadeIn">
                    {/* Floating Tags */}
                    <div className="absolute top-[15%] -right-4 md:-right-8 z-20 bg-white/95 backdrop-blur-xl p-4 md:p-6 rounded-[32px] shadow-2xl border border-emerald-500/10 scale-90 md:scale-110">
                        <span className="text-emerald-600 text-[10px] font-black block mb-1 uppercase tracking-widest">
                            {lang === "es" ? "Detectado" : "Detected"}
                        </span>
                        <div className="font-black text-lg md:text-xl text-slate-800">
                            🥑 {lang === "es" ? "Aguacate" : "Avocado"} • 234 kcal
                        </div>
                    </div>
                    <div className="absolute bottom-[25%] -left-4 md:-left-12 z-20 bg-slate-900 p-4 md:p-6 rounded-[32px] shadow-2xl scale-90 md:scale-110 text-white">
                        <span className="text-emerald-400 text-[10px] font-black block mb-1 uppercase tracking-widest">
                            {lang === "es" ? "Kili dice" : "Kili says"}
                        </span>
                        <div className="font-bold text-base md:text-lg">
                            {lang === "es"
                                ? '"Te faltan 420 kcal hoy. Este plato te deja perfecto."'
                                : '"You need 420 kcal today. This dish gets you there."'}
                        </div>
                    </div>

                    {/* Phone Mockup */}
                    <div className="w-[280px] md:w-[380px] aspect-[1/2] bg-slate-900 rounded-[60px] md:rounded-[80px] p-3 md:p-4 mx-auto shadow-[0_50px_120px_rgba(0,0,0,0.15)] relative overflow-hidden group">
                        <div className="w-full h-full bg-white rounded-[48px] md:rounded-[65px] overflow-hidden relative">
                            <Image
                                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1200"
                                fill
                                sizes="(max-width: 768px) 280px, 380px"
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                alt={
                                    lang === "es"
                                        ? "Qalia Food Analysis - Ensalada fresca"
                                        : "Qalia Food Analysis - Fresh salad"
                                }
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </div>
                    </div>
                </div>
            </header>

            {/* How it works */}
            <section className="bg-slate-900 text-white py-16 md:py-28 px-[6%]">
                <div className="max-w-5xl mx-auto">
                    <h2 className="font-black text-3xl md:text-4xl text-center mb-16 font-display">
                        {dict.landing.howItWorks.title}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                                📸
                            </div>
                            <h3 className="font-black text-xl">
                                {dict.landing.howItWorks.step1.title}
                            </h3>
                            <p className="text-slate-400 font-medium">
                                {dict.landing.howItWorks.step1.description}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                                🔬
                            </div>
                            <h3 className="font-black text-xl">
                                {dict.landing.howItWorks.step2.title}
                            </h3>
                            <p className="text-slate-400 font-medium">
                                {dict.landing.howItWorks.step2.description}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                                💬
                            </div>
                            <h3 className="font-black text-xl">
                                {dict.landing.howItWorks.step3.title}
                            </h3>
                            <p className="text-slate-400 font-medium">
                                {dict.landing.howItWorks.step3.description}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 md:py-40 px-[6%] max-w-[1440px] mx-auto space-y-20">
                <div className="max-w-2xl space-y-6">
                    <span className="text-emerald-600 font-black text-xs tracking-[0.3em] uppercase">
                        {dict.landing.features.badge}
                    </span>
                    <h2 className="font-black text-slate-900 text-4xl md:text-5xl leading-tight font-display">
                        {dict.landing.features.title}
                    </h2>
                    <p className="text-slate-600 text-lg font-medium leading-relaxed">
                        {dict.landing.features.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="card-dark rounded-[32px] p-10">
                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            {dict.landing.features.photoAnalysis.badge}
                        </span>
                        <h3 className="text-2xl font-black mt-4 mb-3 text-white">
                            {dict.landing.features.photoAnalysis.title}
                        </h3>
                        <p className="text-slate-300 font-medium">
                            {dict.landing.features.photoAnalysis.description}
                        </p>
                    </div>
                    <div className="card-dark rounded-[32px] p-10">
                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            {dict.landing.features.alerts.badge}
                        </span>
                        <h3 className="text-2xl font-black mt-4 mb-3 text-white">
                            {dict.landing.features.alerts.title}
                        </h3>
                        <p className="text-slate-300 font-medium">
                            {dict.landing.features.alerts.description}
                        </p>
                    </div>
                    <div className="card-dark rounded-[32px] p-10">
                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            {dict.landing.features.kiliCoach.badge}
                        </span>
                        <h3 className="text-2xl font-black mt-4 mb-3 text-white">
                            {dict.landing.features.kiliCoach.title}
                        </h3>
                        <p className="text-slate-300 font-medium">
                            {dict.landing.features.kiliCoach.description}
                        </p>
                    </div>
                    <div className="card-dark rounded-[32px] p-10">
                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            {dict.landing.features.goals.badge}
                        </span>
                        <h3 className="text-2xl font-black mt-4 mb-3 text-white">
                            {dict.landing.features.goals.title}
                        </h3>
                        <p className="text-slate-300 font-medium">
                            {dict.landing.features.goals.description}
                        </p>
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="bg-slate-50 py-20 px-[6%]">
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <h2 className="font-black text-slate-900 text-3xl md:text-4xl font-display">
                        {dict.landing.testimonials.title}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {dict.landing.testimonials.items.map((item, idx) => (
                            <div
                                key={idx}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left"
                            >
                                <p className="text-slate-600 mb-4 italic">
                                    &quot;{item.quote}&quot;
                                </p>
                                <p className="font-black text-slate-900">— {item.author}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <footer className="bg-slate-900 text-white pt-32 pb-16 px-[6%] text-center rounded-t-[60px] md:rounded-t-[100px]">
                <div className="max-w-4xl mx-auto space-y-16">
                    <div className="space-y-6">
                        <span className="text-emerald-500 font-black text-xs tracking-[0.3em] uppercase">
                            {dict.landing.cta.badge}
                        </span>
                        <h2 className="font-black text-4xl md:text-6xl leading-[1.1] font-display">
                            {dict.landing.cta.title}
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            {dict.landing.cta.description}
                        </p>
                    </div>
                    <Link
                        href={`/${lang}/signup`}
                        className="btn-kinetic inline-block px-14 py-6 bg-emerald-600 text-white rounded-[32px] font-black shadow-2xl shadow-emerald-600/20 text-lg md:text-xl uppercase tracking-widest"
                    >
                        {dict.landing.cta.button}
                    </Link>
                    <div className="pt-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-3 opacity-60">
                            <QaliaLogo className="w-6 h-6" color="white" />
                            <span className="font-black text-[11px] tracking-widest uppercase">
                                QALIA © 2025
                            </span>
                        </div>
                        <nav
                            className="flex gap-10 opacity-40"
                            aria-label="Footer navigation"
                        >
                            <Link
                                href={`/${lang}/privacidad`}
                                className="font-black text-[11px] uppercase tracking-widest hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                            >
                                {dict.landing.footer.privacy}
                            </Link>
                            <Link
                                href={`/${lang}/terminos`}
                                className="font-black text-[11px] uppercase tracking-widest hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                            >
                                {dict.landing.footer.terms}
                            </Link>
                            <Link
                                href={`/${lang}/soporte`}
                                className="font-black text-[11px] uppercase tracking-widest hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                            >
                                {dict.landing.footer.support}
                            </Link>
                        </nav>
                    </div>
                </div>
            </footer>
        </div>
    );
}
