"use client";

import { QaliaLogo } from "@/components/ui/QaliaLogo";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { type TabType } from "@/types/dashboard.types";
import { useDictionary } from "@/contexts/DictionaryContext";
import { LanguageSwitcherCompact } from "@/components/i18n/LanguageSwitcher";

interface DashboardLayoutProps {
    children: React.ReactNode;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export function DashboardLayout({
    children,
    activeTab,
    onTabChange,
}: DashboardLayoutProps) {
    const { dictionary } = useDictionary();
    const t = dictionary.dashboard;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Skip to main content link for keyboard users */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[500] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:font-bold focus:text-sm"
            >
                {t.skipToContent}
            </a>

            {/* Desktop Sidebar */}
            <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

            {/* Main Content Area */}
            <main id="main-content" className="flex-1 flex flex-col relative overflow-hidden h-screen">
                {/* Mobile Header */}
                <header className="md:hidden flex justify-between items-center p-4 pt-[calc(1rem+var(--safe-area-top,0px))] bg-white border-b border-slate-100 shrink-0 z-[110]">
                    <div className="flex items-center gap-2">
                        <QaliaLogo className="w-6 h-6" />
                        <span className="font-extrabold text-base tracking-tighter uppercase text-slate-900">
                            Qalia
                        </span>
                    </div>
                </header>

                {/* Content */}
                <div
                    className={`flex-1 relative h-full ${activeTab === "coach"
                        ? "flex flex-col overflow-hidden"
                        : "overflow-y-auto p-3 sm:p-4 md:p-10 no-scrollbar pb-[var(--bottom-nav-height)] md:pb-12"
                        }`}
                >
                    <div
                        className={`max-w-4xl mx-auto w-full ${activeTab === "coach" || activeTab === "scanner" ? "h-full flex flex-col" : ""
                            }`}
                    >
                        {children}
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
        </div>
    );
}
