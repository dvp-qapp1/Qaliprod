"use client";

import { QaliaLogo } from "@/components/ui/QaliaLogo";
import { type TabType } from "@/types/dashboard.types";
import { useDictionary } from "@/contexts/DictionaryContext";
import { LanguageSwitcher, LanguageSwitcherCompact } from "@/components/i18n/LanguageSwitcher";

interface SidebarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

// Icon components for cleaner code
function HomeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 001 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}

function HistoryIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function CameraIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        </svg>
    );
}

function ChatIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
    );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}

const ICON_MAP = {
    home: HomeIcon,
    history: HistoryIcon,
    scanner: CameraIcon,
    coach: ChatIcon,
    profile: UserIcon,
};

const NAV_TABS: { id: TabType; icon: keyof typeof ICON_MAP }[] = [
    { id: "home", icon: "home" },
    { id: "history", icon: "history" },
    { id: "scanner", icon: "scanner" },
    { id: "coach", icon: "coach" },
    { id: "profile", icon: "profile" },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const { dictionary } = useDictionary();
    const t = dictionary.dashboard.tabs;

    return (
        <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-white border-r border-slate-100 p-6 z-50">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 px-2">
                <QaliaLogo className="w-9 h-9" />
                <h1 className="text-2xl font-black text-slate-800 hidden lg:block tracking-tighter">
                    Qalia
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2" aria-label="Main navigation">
                {NAV_TABS.map((item) => {
                    const IconComponent = ICON_MAP[item.icon];
                    const isActive = activeTab === item.id;
                    const label = t[item.id];

                    return (
                        <button
                            type="button"
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 w-full focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none ${isActive
                                ? "text-emerald-600 bg-emerald-50 lg:bg-slate-900 lg:text-white"
                                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                }`}
                        >
                            <span className="shrink-0" aria-hidden="true">
                                <IconComponent className="w-6 h-6" />
                            </span>
                            <span className="font-bold text-sm hidden lg:block tracking-tight capitalize">
                                {label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
