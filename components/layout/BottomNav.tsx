"use client";

import { QaliaLogo } from "@/components/ui/QaliaLogo";
import { type TabType } from "@/types/dashboard.types";
import { useDictionary } from "@/contexts/DictionaryContext";

interface BottomNavProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

// Icon components with active state handling
function HomeIcon({ active }: { active: boolean }) {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={active ? "2.5" : "2"}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 001 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
        </svg>
    );
}

function HistoryIcon({ active }: { active: boolean }) {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={active ? "2.5" : "2"}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
}

function ChatIcon({ active }: { active: boolean }) {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={active ? "2.5" : "2"}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
        </svg>
    );
}

function UserIcon({ active }: { active: boolean }) {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={active ? "2.5" : "2"}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
        </svg>
    );
}

interface NavButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

function NavButton({ label, isActive, onClick, children }: NavButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none ${isActive
                ? "text-emerald-500"
                : "text-slate-400 hover:text-slate-600"
                }`}
        >
            {children}
            <span className="text-[8px] font-semibold">{label}</span>
        </button>
    );
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const { dictionary } = useDictionary();
    const t = dictionary.dashboard.tabs;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-1 pt-1.5 pb-[calc(0.25rem+var(--safe-area-bottom,0px))] z-[300] md:hidden">
            <div className="flex justify-around items-center">
                <NavButton
                    label={t.home}
                    isActive={activeTab === "home"}
                    onClick={() => onTabChange("home")}
                >
                    <HomeIcon active={activeTab === "home"} />
                </NavButton>

                <NavButton
                    label={t.history}
                    isActive={activeTab === "history"}
                    onClick={() => onTabChange("history")}
                >
                    <HistoryIcon active={activeTab === "history"} />
                </NavButton>

                {/* Center scanner button */}
                <button
                    type="button"
                    onClick={() => onTabChange("scanner")}
                    aria-label={t.scanner}
                    aria-current={activeTab === "scanner" ? "page" : undefined}
                    className="relative -mt-3 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:bg-emerald-400 hover:shadow-xl hover:scale-105 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-90"
                >
                    <QaliaLogo className="w-6 h-6" color="white" />
                </button>

                <NavButton
                    label={t.coach}
                    isActive={activeTab === "coach"}
                    onClick={() => onTabChange("coach")}
                >
                    <ChatIcon active={activeTab === "coach"} />
                </NavButton>

                <NavButton
                    label={t.profile}
                    isActive={activeTab === "profile"}
                    onClick={() => onTabChange("profile")}
                >
                    <UserIcon active={activeTab === "profile"} />
                </NavButton>
            </div>
        </nav>
    );
}
