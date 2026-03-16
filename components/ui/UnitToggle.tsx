"use client";

interface UnitToggleProps {
    options: string[];
    selected: string;
    onChange: (unit: string) => void;
}

export function UnitToggle({ options, selected, onChange }: UnitToggleProps) {
    return (
        <div className="flex justify-center">
            <div className="inline-flex bg-slate-100 rounded-2xl p-1.5">
                {options.map((option) => (
                    <button
                        key={option}
                        onClick={() => onChange(option)}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${selected === option
                                ? "bg-white text-emerald-600 shadow-md"
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
}
