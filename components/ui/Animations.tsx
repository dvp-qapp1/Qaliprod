"use client";

import { motion, AnimatePresence, type Variants, type Transition } from "framer-motion";
import { type ReactNode } from "react";

// ============================================================================
// Animation Presets
// ============================================================================

/**
 * Common transition presets
 */
export const transitions = {
    spring: { type: "spring", stiffness: 300, damping: 30 } as Transition,
    smooth: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } as Transition,
    bouncy: { type: "spring", stiffness: 400, damping: 25 } as Transition,
    slow: { duration: 0.5, ease: "easeInOut" } as Transition,
} as const;

/**
 * Common animation variants
 */
export const variants = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    } as Variants,

    fadeInUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
    } as Variants,

    fadeInDown: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    } as Variants,

    scaleIn: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
    } as Variants,

    slideInRight: {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
    } as Variants,

    slideInLeft: {
        initial: { opacity: 0, x: -50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 50 },
    } as Variants,
} as const;

// ============================================================================
// FadeIn Component
// ============================================================================

interface FadeInProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
}

/**
 * Simple fade-in animation wrapper
 * 
 * @example
 * <FadeIn delay={0.2}>
 *   <Card>Content</Card>
 * </FadeIn>
 */
export function FadeIn({ children, delay = 0, duration = 0.3, className = "" }: FadeInProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay, duration, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ============================================================================
// FadeInUp Component
// ============================================================================

interface FadeInUpProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    distance?: number;
    className?: string;
}

/**
 * Fade in with upward movement animation
 * 
 * @example
 * <FadeInUp delay={0.1} distance={30}>
 *   <h1>Hello</h1>
 * </FadeInUp>
 */
export function FadeInUp({
    children,
    delay = 0,
    duration = 0.4,
    distance = 20,
    className = ""
}: FadeInUpProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: distance }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration, ease: [0.4, 0, 0.2, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ============================================================================
// ScaleIn Component
// ============================================================================

interface ScaleInProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
}

/**
 * Scale in animation
 * 
 * @example
 * <ScaleIn>
 *   <Avatar />
 * </ScaleIn>
 */
export function ScaleIn({ children, delay = 0, duration = 0.3, className = "" }: ScaleInProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                delay,
                duration,
                type: "spring",
                stiffness: 300,
                damping: 25,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ============================================================================
// StaggerChildren Component
// ============================================================================

interface StaggerChildrenProps {
    children: ReactNode;
    staggerDelay?: number;
    className?: string;
}

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

/**
 * Container that staggers children animations
 * 
 * @example
 * <StaggerChildren staggerDelay={0.05}>
 *   {items.map(item => (
 *     <StaggerItem key={item.id}>
 *       <ItemCard item={item} />
 *     </StaggerItem>
 *   ))}
 * </StaggerChildren>
 */
export function StaggerChildren({
    children,
    staggerDelay = 0.1,
    className = ""
}: StaggerChildrenProps) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            initial="hidden"
            animate="show"
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface StaggerItemProps {
    children: ReactNode;
    className?: string;
}

/**
 * Child item for StaggerChildren
 */
export function StaggerItem({ children, className = "" }: StaggerItemProps) {
    return (
        <motion.div variants={staggerItem} className={className}>
            {children}
        </motion.div>
    );
}

// ============================================================================
// AnimatedModal Component
// ============================================================================

interface AnimatedModalProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

/**
 * Modal with enter/exit animations using AnimatePresence
 * 
 * @example
 * <AnimatedModal isOpen={isOpen} onClose={close}>
 *   <div className="bg-white p-8 rounded-3xl">
 *     Modal content
 *   </div>
 * </AnimatedModal>
 */
export function AnimatedModal({ children, isOpen, onClose, className = "" }: AnimatedModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`fixed inset-0 z-[600] flex items-center justify-center p-4 ${className}`}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="relative"
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// AnimatedList Component
// ============================================================================

interface AnimatedListProps<T> {
    items: T[];
    getKey: (item: T) => string | number;
    renderItem: (item: T, index: number) => ReactNode;
    className?: string;
}

/**
 * List with enter/exit animations for items
 * 
 * @example
 * <AnimatedList
 *   items={meals}
 *   getKey={(meal) => meal.id}
 *   renderItem={(meal) => <MealCard meal={meal} />}
 * />
 */
export function AnimatedList<T>({
    items,
    getKey,
    renderItem,
    className = ""
}: AnimatedListProps<T>) {
    return (
        <div className={className}>
            <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                    <motion.div
                        key={getKey(item)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                        transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                        }}
                        layout
                    >
                        {renderItem(item, index)}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Hover/Tap Animation Wrapper
// ============================================================================

interface InteractiveProps {
    children: ReactNode;
    className?: string;
    scale?: number;
    lift?: boolean;
}

/**
 * Wrapper that adds hover/tap animations
 * 
 * @example
 * <Interactive scale={1.02} lift>
 *   <button>Click me</button>
 * </Interactive>
 */
export function Interactive({
    children,
    className = "",
    scale = 1.02,
    lift = false,
}: InteractiveProps) {
    return (
        <motion.div
            whileHover={{
                scale,
                y: lift ? -4 : 0,
            }}
            whileTap={{ scale: 0.98 }}
            transition={transitions.spring}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ============================================================================
// PageTransition Component
// ============================================================================

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

/**
 * Page transition wrapper
 * 
 * @example
 * // In a page component
 * export default function MyPage() {
 *   return (
 *     <PageTransition>
 *       <div>Page content</div>
 *     </PageTransition>
 *   );
 * }
 */
export function PageTransition({ children, className = "" }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Re-export framer-motion utilities for convenience
export { motion, AnimatePresence };
export type { Variants, Transition };
