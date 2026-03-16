import { useMemo, useState, useCallback } from "react";
import { type PantryItem, type PantryCategory } from "@/types/dashboard.types";
import { useDictionary } from "@/contexts/DictionaryContext";
import { AccessibleModal } from "@/components/ui/AccessibleModal";

interface AlacenaTabProps {
    items: PantryItem[];
    onScanMore: () => void;
    onItemClick: (item: PantryItem) => void;
    onDeleteItem: (id: string) => void;
    onUpdateItem: (id: string, updates: { quantity: number | null; unit: string | null; name?: string | null }) => void;
    onRecipeGenerated?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
    abarrotes: "🥫",
    congelados: "❄️",
    refrigerados: "🥛",
    frutas_verduras: "🥗",
    snacks_dulces: "🍪",
    bebidas: "🧃",
    especias_condimentos: "🧂",
    panaderia_reposteria: "🥐",
    otros: "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
    abarrotes: "bg-orange-50 text-orange-600 border-orange-100",
    congelados: "bg-blue-50 text-blue-600 border-blue-100",
    refrigerados: "bg-cyan-50 text-cyan-600 border-cyan-100",
    frutas_verduras: "bg-emerald-50 text-emerald-600 border-emerald-100",
    snacks_dulces: "bg-pink-50 text-pink-600 border-pink-100",
    bebidas: "bg-indigo-50 text-indigo-600 border-indigo-100",
    especias_condimentos: "bg-amber-50 text-amber-600 border-amber-100",
    panaderia_reposteria: "bg-yellow-50 text-yellow-600 border-yellow-100",
    otros: "bg-slate-50 text-slate-600 border-slate-100",
};

interface IngredientRowProps {
    item: PantryItem;
    onEdit: () => void;
    onDelete: () => void;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    t: any;
    ta: any;
}

function IngredientRow({ item, onEdit, onDelete, isSelected, onToggleSelect, t, ta }: IngredientRowProps) {
    const category = (item.category as string) || "otros";
    const icon = CATEGORY_ICONS[category] || "📦";
    const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.otros;
    const displayName = item.nickname || item.ingredientName;

    return (
        <div
            onClick={onToggleSelect}
            className={`flex items-center gap-3 p-3 bg-white border rounded-xl transition-all cursor-pointer ${isSelected
                ? 'border-emerald-400 bg-emerald-50/50 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 active:bg-slate-50'
                }`}
        >
            {/* Checkbox */}
            <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-200'
                }`}>
                {isSelected && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>

            {/* Icon */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg ${colorClass.split(' ')[0]}`}>
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate leading-tight">
                    {displayName}
                </p>
                {item.nickname && (
                    <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5 italic">
                        {ta.original}: {item.ingredientName}
                    </p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                    {item.quantity && `${item.quantity} ${item.unit || ta.defaultUnit}`}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onEdit}
                    className="p-1.5 text-slate-300 hover:text-emerald-500 rounded-lg transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export function AlacenaTab({ items, onScanMore, onItemClick, onDeleteItem, onUpdateItem, onRecipeGenerated }: AlacenaTabProps) {
    const { dictionary, locale } = useDictionary();
    const t = dictionary.dashboard.home;
    const ta = dictionary.dashboard.alacena;
    const tc = dictionary.common;
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Selection state for Chef Mode
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);

    const toggleItemSelection = useCallback((itemId: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedItems(new Set());
    }, []);

    const handleGenerateRecipe = async () => {
        if (selectedItems.size === 0 || isGenerating) return;

        const selectedIngredients = items
            .filter(item => selectedItems.has(item.id))
            .map(item => item.ingredientName);

        setIsGenerating(true);
        try {
            const response = await fetch('/api/meals/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredientNames: selectedIngredients,
                    locale,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate recipe');
            }

            clearSelection();
            onRecipeGenerated?.();
        } catch (error) {
            console.error('Error generating recipe:', error);
            // TODO: Show error toast
        } finally {
            setIsGenerating(false);
        }
    };

    // Modal state
    const [itemToEdit, setItemToEdit] = useState<PantryItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<PantryItem | null>(null);
    const [editForm, setEditForm] = useState<{ quantity: string; unit: string; name: string }>({
        quantity: "",
        unit: "",
        name: ""
    });

    const openEditModal = (item: PantryItem) => {
        setItemToEdit(item);
        setEditForm({
            name: item.nickname || item.ingredientName,
            quantity: item.quantity?.toString() || "",
            unit: item.unit || "gramos",
        });
    };

    const handleSaveEdit = () => {
        if (!itemToEdit) return;
        onUpdateItem(itemToEdit.id, {
            name: editForm.name !== itemToEdit.ingredientName ? editForm.name : null,
            quantity: editForm.quantity ? parseFloat(editForm.quantity) : null,
            unit: editForm.unit || null,
        });
        setItemToEdit(null);
    };

    const categories = useMemo(() => {
        const existing = new Set<string>();
        items.forEach(item => {
            if (item.category) existing.add(item.category);
        });

        const order = Object.keys(CATEGORY_ICONS);
        const sorted = Array.from(existing).sort((a, b) => {
            const idxA = order.indexOf(a);
            const idxB = order.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        return ["all", ...sorted];
    }, [items]);

    // Reset selected category if it no longer exists in current items
    useMemo(() => {
        if (selectedCategory !== "all" && !categories.includes(selectedCategory)) {
            setSelectedCategory("all");
        }
    }, [categories, selectedCategory]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const nameToSearch = (item.nickname || item.ingredientName).toLowerCase();
            const matchesSearch = nameToSearch.includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchQuery, selectedCategory]);

    // When "all" is selected, we group them. Otherwise we just show the list.
    const groupedItems = useMemo(() => {
        if (selectedCategory !== "all") return null;

        const groups: Record<string, PantryItem[]> = {};
        filteredItems.forEach(item => {
            const cat = (item.category as string) || "otros";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });

        const order = Object.keys(CATEGORY_ICONS);
        return Object.keys(groups)
            .sort((a, b) => order.indexOf(a) - order.indexOf(b))
            .reduce((acc, key) => {
                acc[key] = groups[key];
                return acc;
            }, {} as Record<string, PantryItem[]>);
    }, [filteredItems, selectedCategory]);

    return (
        <div className="space-y-4 animate-fadeIn pb-32">
            {/* Compact Header */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="text-2xl">📦</span>
                        {t.pantryTitle}
                    </h2>
                    <button
                        onClick={onScanMore}
                        className="bg-emerald-500 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-400 active:scale-95"
                        aria-label={ta.addIngredients}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* Selection Controls - Always visible when items exist */}
                {items.length > 0 && (
                    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${selectedItems.size > 0
                        ? 'bg-emerald-50'
                        : 'bg-slate-50'
                        }`}>
                        <button
                            onClick={() => {
                                if (selectedItems.size === items.length) {
                                    clearSelection();
                                } else {
                                    setSelectedItems(new Set(items.map(i => i.id)));
                                }
                            }}
                            className={`text-sm font-bold flex items-center gap-2 transition-colors ${selectedItems.size > 0
                                ? 'text-emerald-700'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedItems.size === items.length && items.length > 0
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : selectedItems.size > 0
                                    ? 'bg-emerald-200 border-emerald-500'
                                    : 'border-slate-300'
                                }`}>
                                {selectedItems.size === items.length && items.length > 0 && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            {selectedItems.size === 0
                                ? ta.selectAll
                                : `${selectedItems.size}/${items.length} ${ta.selected}`
                            }
                        </button>
                        {selectedItems.size > 0 && (
                            <button
                                onClick={clearSelection}
                                className="text-emerald-600 hover:text-emerald-800 text-xs font-bold transition-colors"
                            >
                                {ta.clear}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Category Pills - Scrollable */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedCategory === cat
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                    >
                        {cat === "all" ? ta.allCategories : (t.pantryCategories[cat as keyof typeof t.pantryCategories] || cat)}
                    </button>
                ))}
            </div>

            {/* Premium Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder={ta.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-xs font-bold text-slate-600"
                />
            </div>

            {items.length === 0 ? (
                <div className="bg-white border border-slate-100 p-12 rounded-[40px] text-center space-y-4 shadow-sm">
                    <p className="text-5xl">🥡</p>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t.pantryEmpty}</p>
                    <button onClick={onScanMore} className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors">
                        {ta.scanNow}
                    </button>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                    <p className="text-3xl">🔍</p>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{ta.noResults}</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {selectedCategory === "all" && groupedItems ? (
                        Object.entries(groupedItems).map(([category, catItems]) => (
                            <div key={category} className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="text-lg">{CATEGORY_ICONS[category]}</span>
                                        {t.pantryCategories[category as keyof typeof t.pantryCategories] || category}
                                    </h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {catItems.map((item) => (
                                        <IngredientRow
                                            key={item.id}
                                            item={item}
                                            onEdit={() => openEditModal(item)}
                                            onDelete={() => setItemToDelete(item)}
                                            isSelected={selectedItems.has(item.id)}
                                            onToggleSelect={() => toggleItemSelection(item.id)}
                                            t={t}
                                            ta={ta}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredItems.map((item) => (
                                <IngredientRow
                                    key={item.id}
                                    item={item}
                                    onEdit={() => openEditModal(item)}
                                    onDelete={() => setItemToDelete(item)}
                                    isSelected={selectedItems.has(item.id)}
                                    onToggleSelect={() => toggleItemSelection(item.id)}
                                    t={t}
                                    ta={ta}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )
            }

            {/* EDIT MODAL */}
            <AccessibleModal
                isOpen={!!itemToEdit}
                onClose={() => setItemToEdit(null)}
                title={ta.editProduct}
            >
                <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${CATEGORY_COLORS[itemToEdit?.category || "otros"].split(' ')[0]}`}>
                            {CATEGORY_ICONS[itemToEdit?.category || "otros"]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full text-xl font-black text-slate-800 bg-transparent border-b-2 border-transparent focus:border-emerald-500/30 outline-none transition-all placeholder:text-slate-300"
                                placeholder={ta.ingredientNamePlaceholder}
                            />
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                                {t.pantryCategories[itemToEdit?.category as keyof typeof t.pantryCategories] || itemToEdit?.category}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{ta.quantityLabel}</label>
                            <input
                                type="number"
                                value={editForm.quantity}
                                onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 placeholder:text-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                placeholder={ta.quantityPlaceholder}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{ta.unitLabel}</label>
                            <div className="relative">
                                <select
                                    value={editForm.unit}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="gramos">{ta.unitGrams}</option>
                                    <option value="unidades">{ta.unitUnits}</option>
                                    <option value="ml">{ta.unitMl}</option>
                                    <option value="litros">{ta.unitLiters}</option>
                                    <option value="kg">{ta.unitKg}</option>
                                </select>
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={() => setItemToEdit(null)}
                            className="flex-1 px-8 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.1em] text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 transition-all border border-slate-100"
                        >
                            {tc.cancel}
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            className="flex-2 px-8 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.1em] text-white bg-emerald-500 shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all"
                        >
                            {ta.saveChanges}
                        </button>
                    </div>
                </div>
            </AccessibleModal>

            {/* DELETE MODAL */}
            <AccessibleModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                title={ta.deleteProduct}
                maxWidth="max-w-xs"
            >
                <div className="p-8 text-center space-y-8">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center text-4xl mx-auto shadow-sm animate-pulse">
                        🗑️
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">{ta.deleteTitle}</h3>
                        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                            {ta.deleteMessage1} <span className="font-bold text-slate-800">"{itemToDelete?.nickname || itemToDelete?.ingredientName}"</span> {ta.deleteMessage2}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                if (itemToDelete) onDeleteItem(itemToDelete.id);
                                setItemToDelete(null);
                            }}
                            className="w-full py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.1em] text-white bg-rose-500 hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-rose-500/20"
                        >
                            {ta.confirmDelete}
                        </button>
                        <button
                            onClick={() => setItemToDelete(null)}
                            className="w-full py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.1em] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                        >
                            {ta.cancelDelete}
                        </button>
                    </div>
                </div>
            </AccessibleModal>

            {/* Floating Generate Recipe Button */}
            {selectedItems.size > 0 && (
                <div className="fixed bottom-24 left-0 right-0 z-40 px-4 flex justify-center animate-fadeIn">
                    <button
                        type="button"
                        onClick={handleGenerateRecipe}
                        disabled={isGenerating}
                        className={`text-white px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-500/40 transition-all flex items-center gap-3 ${isGenerating
                            ? 'bg-slate-400 cursor-wait'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-95'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {ta.generating}
                            </>
                        ) : (
                            <>
                                <span className="text-xl">👨‍🍳</span>
                                {ta.generateRecipe} ({selectedItems.size})
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
