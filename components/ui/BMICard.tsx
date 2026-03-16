import { useDictionary } from "@/contexts/DictionaryContext";

interface BMICardProps {
    bmi: number | null;
    category: string | null;
    isCalculating?: boolean;
    goal?: string | null;
    showFullMessage?: boolean;
}

export function BMICard({
    bmi,
    category,
    isCalculating = false,
    goal,
    showFullMessage = false
}: BMICardProps) {
    const { dictionary } = useDictionary();
    const t = dictionary.bmiCard;

    const BMI_DATA: Record<string, {
        emoji: string;
        label: string;
        bgColor: string;
        textColor: string;
        message: string;
    }> = {
        "bajo peso": {
            emoji: "💨",
            label: t.categories.underweight.label,
            bgColor: "bg-blue-50 border-blue-100",
            textColor: "text-blue-600",
            message: t.categories.underweight.message
        },
        "underweight": {
            emoji: "💨",
            label: t.categories.underweight.label,
            bgColor: "bg-blue-50 border-blue-100",
            textColor: "text-blue-600",
            message: t.categories.underweight.message
        },
        "normal": {
            emoji: "✨",
            label: t.categories.normal.label,
            bgColor: "bg-emerald-50 border-emerald-100",
            textColor: "text-emerald-600",
            message: t.categories.normal.message
        },
        "sobrepeso": {
            emoji: "⚡",
            label: t.categories.overweight.label,
            bgColor: "bg-amber-50 border-amber-100",
            textColor: "text-amber-600",
            message: t.categories.overweight.message
        },
        "overweight": {
            emoji: "⚡",
            label: t.categories.overweight.label,
            bgColor: "bg-amber-50 border-amber-100",
            textColor: "text-amber-600",
            message: t.categories.overweight.message
        },
        "obesidad": {
            emoji: "🔥",
            label: t.categories.obese.label,
            bgColor: "bg-red-50 border-red-100",
            textColor: "text-red-600",
            message: t.categories.obese.message
        },
        "obese": {
            emoji: "🔥",
            label: t.categories.obese.label,
            bgColor: "bg-red-50 border-red-100",
            textColor: "text-red-600",
            message: t.categories.obese.message
        }
    };

    if (isCalculating || !bmi || !category) {
        return (
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                    <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm font-medium">
                        {t.calculating}
                    </span>
                </div>
            </div>
        );
    }

    const normalizedCategory = category.toLowerCase();
    const data = BMI_DATA[normalizedCategory] || BMI_DATA["normal"];

    return (
        <div className={`mt-8 p-6 rounded-2xl border ${data.bgColor} animate-fadeInUp`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{data.emoji}</span>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {t.yourBmi}
                        </p>
                        <p className={`text-2xl font-black ${data.textColor}`}>
                            {bmi.toFixed(1)}
                        </p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-full ${data.bgColor} ${data.textColor} font-bold text-sm`}>
                    {data.label}
                </div>
            </div>

            {showFullMessage && (
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                    {data.message}
                </p>
            )}

            {goal && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                        <span className="font-bold">{t.yourGoal}:</span> {goal}
                    </p>
                </div>
            )}
        </div>
    );
}
