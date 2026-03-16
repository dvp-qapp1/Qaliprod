"use client";

import React, { createContext, useContext, type ReactNode } from "react";

// ============================================================================
// Card Context (for compound component pattern)
// ============================================================================

interface CardContextValue {
    variant: "default" | "outlined" | "elevated" | "gradient";
}

const CardContext = createContext<CardContextValue | undefined>(undefined);

function useCardContext() {
    const context = useContext(CardContext);
    if (!context) {
        throw new Error("Card compound components must be used within a Card");
    }
    return context;
}

// ============================================================================
// Card Component
// ============================================================================

interface CardProps {
    children: ReactNode;
    variant?: "default" | "outlined" | "elevated" | "gradient";
    className?: string;
    padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
    default: "bg-white border border-slate-100",
    outlined: "bg-white border-2 border-slate-200",
    elevated: "bg-white shadow-lg shadow-slate-200/50",
    gradient: "bg-gradient-to-br from-white to-slate-50 border border-slate-100",
};

const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
};

/**
 * Compound Card component following composition pattern.
 * 
 * @example
 * <Card variant="elevated">
 *   <Card.Header>
 *     <Card.Title>My Card</Card.Title>
 *     <Card.Description>Some description</Card.Description>
 *   </Card.Header>
 *   <Card.Body>
 *     Content goes here
 *   </Card.Body>
 *   <Card.Footer>
 *     <button>Action</button>
 *   </Card.Footer>
 * </Card>
 */
function Card({
    children,
    variant = "default",
    className = "",
    padding = "md",
}: CardProps) {
    return (
        <CardContext.Provider value={{ variant }}>
            <div
                className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
            >
                {children}
            </div>
        </CardContext.Provider>
    );
}

// ============================================================================
// Card.Header
// ============================================================================

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

function CardHeader({ children, className = "" }: CardHeaderProps) {
    return (
        <div className={`space-y-1 ${className}`}>
            {children}
        </div>
    );
}

// ============================================================================
// Card.Title
// ============================================================================

interface CardTitleProps {
    children: ReactNode;
    as?: "h2" | "h3" | "h4";
    className?: string;
}

function CardTitle({ children, as: Component = "h3", className = "" }: CardTitleProps) {
    return (
        <Component className={`text-lg font-black text-slate-800 ${className}`}>
            {children}
        </Component>
    );
}

// ============================================================================
// Card.Description
// ============================================================================

interface CardDescriptionProps {
    children: ReactNode;
    className?: string;
}

function CardDescription({ children, className = "" }: CardDescriptionProps) {
    return (
        <p className={`text-sm text-slate-500 ${className}`}>
            {children}
        </p>
    );
}

// ============================================================================
// Card.Body
// ============================================================================

interface CardBodyProps {
    children: ReactNode;
    className?: string;
}

function CardBody({ children, className = "" }: CardBodyProps) {
    return (
        <div className={`mt-4 ${className}`}>
            {children}
        </div>
    );
}

// ============================================================================
// Card.Footer
// ============================================================================

interface CardFooterProps {
    children: ReactNode;
    className?: string;
    align?: "left" | "center" | "right" | "between";
}

const alignStyles = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
};

function CardFooter({ children, className = "", align = "right" }: CardFooterProps) {
    return (
        <div className={`mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 ${alignStyles[align]} ${className}`}>
            {children}
        </div>
    );
}

// ============================================================================
// Card.Stat (for stat cards)
// ============================================================================

interface CardStatProps {
    label: string;
    value: string | number;
    trend?: { value: number; direction: "up" | "down" };
    icon?: ReactNode;
    color?: "default" | "emerald" | "blue" | "amber" | "rose";
}

const colorStyles = {
    default: "text-slate-800",
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
};

function CardStat({ label, value, trend, icon, color = "default" }: CardStatProps) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                {icon && <span className="text-slate-400">{icon}</span>}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {label}
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${colorStyles[color]}`}>
                    {value}
                </span>
                {trend && (
                    <span
                        className={`text-xs font-bold ${trend.direction === "up" ? "text-emerald-500" : "text-rose-500"
                            }`}
                    >
                        {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Export compound component
// ============================================================================

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Stat = CardStat;

export { Card };
export type { CardProps, CardHeaderProps, CardTitleProps, CardBodyProps, CardFooterProps, CardStatProps };
