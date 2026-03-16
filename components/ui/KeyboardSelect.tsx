"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type ReactNode } from "react";

// ============================================================================
// Types
// ============================================================================

export interface SelectOption<T = string> {
    value: T;
    label: string;
    disabled?: boolean;
    icon?: ReactNode;
}

interface KeyboardSelectProps<T = string> {
    options: SelectOption<T>[];
    value: T | null;
    onChange: (value: T) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    error?: boolean;
    id?: string;
    name?: string;
    /** aria-label for screen readers */
    label?: string;
}

// ============================================================================
// KeyboardSelect Component
// ============================================================================

/**
 * Accessible select component with full keyboard navigation.
 * 
 * Features:
 * - Arrow Up/Down to navigate options
 * - Enter/Space to select
 * - Escape to close
 * - Type to search/filter
 * - Focus management
 * - ARIA attributes
 * 
 * @example
 * <KeyboardSelect
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *   ]}
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   placeholder="Select an option..."
 *   label="Choose option"
 * />
 */
export function KeyboardSelect<T extends string | number>({
    options,
    value,
    onChange,
    placeholder = "Seleccionar...",
    disabled = false,
    className = "",
    error = false,
    id,
    name,
    label,
}: KeyboardSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Find selected option
    const selectedOption = options.find(opt => opt.value === value);

    // Get enabled options for navigation
    const enabledOptions = options.filter(opt => !opt.disabled);

    // Handle opening dropdown
    const openDropdown = useCallback(() => {
        if (disabled) return;
        setIsOpen(true);
        // Set initial highlighted index to selected option or first option
        const selectedIndex = options.findIndex(opt => opt.value === value);
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }, [disabled, options, value]);

    // Handle closing dropdown
    const closeDropdown = useCallback(() => {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchQuery("");
    }, []);

    // Handle option selection
    const selectOption = useCallback((option: SelectOption<T>) => {
        if (option.disabled) return;
        onChange(option.value);
        closeDropdown();
    }, [onChange, closeDropdown]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;

        switch (e.key) {
            case "Enter":
            case " ":
                e.preventDefault();
                if (isOpen && highlightedIndex >= 0) {
                    const option = options[highlightedIndex];
                    if (option && !option.disabled) {
                        selectOption(option);
                    }
                } else {
                    openDropdown();
                }
                break;

            case "Escape":
                e.preventDefault();
                closeDropdown();
                break;

            case "ArrowDown":
                e.preventDefault();
                if (!isOpen) {
                    openDropdown();
                } else {
                    setHighlightedIndex(prev => {
                        let next = prev + 1;
                        while (next < options.length && options[next]?.disabled) {
                            next++;
                        }
                        return next < options.length ? next : prev;
                    });
                }
                break;

            case "ArrowUp":
                e.preventDefault();
                if (!isOpen) {
                    openDropdown();
                } else {
                    setHighlightedIndex(prev => {
                        let next = prev - 1;
                        while (next >= 0 && options[next]?.disabled) {
                            next--;
                        }
                        return next >= 0 ? next : prev;
                    });
                }
                break;

            case "Home":
                e.preventDefault();
                if (isOpen) {
                    const firstEnabled = options.findIndex(opt => !opt.disabled);
                    setHighlightedIndex(firstEnabled);
                }
                break;

            case "End":
                e.preventDefault();
                if (isOpen) {
                    for (let i = options.length - 1; i >= 0; i--) {
                        if (!options[i].disabled) {
                            setHighlightedIndex(i);
                            break;
                        }
                    }
                }
                break;

            case "Tab":
                closeDropdown();
                break;

            default:
                // Type to search
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                    if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current);
                    }

                    const newQuery = searchQuery + e.key.toLowerCase();
                    setSearchQuery(newQuery);

                    // Find matching option
                    const matchIndex = options.findIndex(
                        opt => !opt.disabled && opt.label.toLowerCase().startsWith(newQuery)
                    );
                    if (matchIndex >= 0) {
                        setHighlightedIndex(matchIndex);
                        if (!isOpen) openDropdown();
                    }

                    searchTimeoutRef.current = setTimeout(() => {
                        setSearchQuery("");
                    }, 500);
                }
                break;
        }
    }, [disabled, isOpen, highlightedIndex, options, searchQuery, openDropdown, closeDropdown, selectOption]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && listRef.current) {
            const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: "nearest" });
            }
        }
    }, [isOpen, highlightedIndex]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                closeDropdown();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, closeDropdown]);

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
        >
            {/* Trigger button */}
            <button
                type="button"
                id={id}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={`${id || "select"}-listbox`}
                aria-label={label}
                disabled={disabled}
                onClick={() => isOpen ? closeDropdown() : openDropdown()}
                onKeyDown={handleKeyDown}
                className={`
                    w-full px-4 py-3 text-left text-sm font-medium
                    bg-white border-2 rounded-2xl
                    transition-all duration-200
                    focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none
                    ${error
                        ? "border-rose-300 focus-visible:ring-rose-500"
                        : isOpen
                            ? "border-emerald-400 ring-2 ring-emerald-100"
                            : "border-slate-200 hover:border-slate-300"
                    }
                    ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"}
                `}
            >
                <span className={selectedOption ? "text-slate-800" : "text-slate-400"}>
                    {selectedOption ? (
                        <span className="flex items-center gap-2">
                            {selectedOption.icon}
                            {selectedOption.label}
                        </span>
                    ) : placeholder}
                </span>

                {/* Chevron */}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <ul
                    ref={listRef}
                    id={`${id || "select"}-listbox`}
                    role="listbox"
                    aria-label={label}
                    className="
                        absolute z-50 mt-2 w-full
                        bg-white border border-slate-200 rounded-2xl shadow-xl
                        max-h-60 overflow-auto
                        py-1
                    "
                >
                    {options.map((option, index) => (
                        <li
                            key={String(option.value)}
                            id={`${id || "select"}-option-${index}`}
                            role="option"
                            aria-selected={option.value === value}
                            aria-disabled={option.disabled}
                            onClick={() => !option.disabled && selectOption(option)}
                            onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                            className={`
                                px-4 py-2.5 text-sm font-medium cursor-pointer
                                flex items-center gap-2
                                ${option.disabled
                                    ? "text-slate-300 cursor-not-allowed"
                                    : highlightedIndex === index
                                        ? "bg-emerald-50 text-emerald-700"
                                        : option.value === value
                                            ? "bg-slate-50 text-slate-800"
                                            : "text-slate-600 hover:bg-slate-50"
                                }
                            `}
                        >
                            {option.icon}
                            {option.label}
                            {option.value === value && (
                                <svg className="w-4 h-4 ml-auto text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* Hidden native select for form submission */}
            {name && (
                <select
                    name={name}
                    value={value ?? ""}
                    onChange={() => { }}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                >
                    <option value="">{placeholder}</option>
                    {options.map(option => (
                        <option key={String(option.value)} value={String(option.value)}>
                            {option.label}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}

// ============================================================================
// useKeyboardNavigation Hook
// ============================================================================

interface UseKeyboardNavigationOptions {
    itemCount: number;
    onSelect: (index: number) => void;
    onEscape?: () => void;
    loop?: boolean;
    orientation?: "vertical" | "horizontal";
}

/**
 * Hook for adding keyboard navigation to any list.
 * 
 * @example
 * const { activeIndex, handleKeyDown, setActiveIndex } = useKeyboardNavigation({
 *   itemCount: items.length,
 *   onSelect: (index) => selectItem(items[index]),
 *   onEscape: closeMenu,
 * });
 */
export function useKeyboardNavigation({
    itemCount,
    onSelect,
    onEscape,
    loop = false,
    orientation = "vertical",
}: UseKeyboardNavigationOptions) {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const prevKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
        const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";

        switch (e.key) {
            case prevKey:
                e.preventDefault();
                setActiveIndex(prev => {
                    if (prev <= 0) {
                        return loop ? itemCount - 1 : 0;
                    }
                    return prev - 1;
                });
                break;

            case nextKey:
                e.preventDefault();
                setActiveIndex(prev => {
                    if (prev >= itemCount - 1) {
                        return loop ? 0 : itemCount - 1;
                    }
                    return prev + 1;
                });
                break;

            case "Enter":
            case " ":
                e.preventDefault();
                onSelect(activeIndex);
                break;

            case "Escape":
                e.preventDefault();
                onEscape?.();
                break;

            case "Home":
                e.preventDefault();
                setActiveIndex(0);
                break;

            case "End":
                e.preventDefault();
                setActiveIndex(itemCount - 1);
                break;
        }
    }, [itemCount, activeIndex, onSelect, onEscape, loop, orientation]);

    return {
        activeIndex,
        setActiveIndex,
        handleKeyDown,
    };
}
