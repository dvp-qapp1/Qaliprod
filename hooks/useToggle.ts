import { useState, useCallback } from "react";

/**
 * Simple toggle state hook.
 * Returns a boolean value and a function to toggle it.
 * 
 * @param initialValue - Initial boolean value (default: false)
 * @returns Tuple of [value, toggle, setValue]
 * 
 * @example
 * const [isOpen, toggleOpen] = useToggle();
 * 
 * // Toggle
 * toggleOpen(); // true
 * toggleOpen(); // false
 * 
 * @example with initial value
 * const [isExpanded, toggleExpanded] = useToggle(true);
 */
export function useToggle(initialValue: boolean = false): [boolean, () => void, (value: boolean) => void] {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(() => {
        setValue(v => !v);
    }, []);

    return [value, toggle, setValue];
}

/**
 * Hook for managing modal open/close state.
 * Provides open, close, and toggle functions for better semantics.
 * 
 * @param initialValue - Initial open state (default: false)
 * @returns Object with isOpen state and open/close/toggle functions
 * 
 * @example
 * const modal = useModalState();
 * 
 * <button onClick={modal.open}>Open Modal</button>
 * {modal.isOpen && (
 *   <Modal onClose={modal.close}>
 *     Content
 *   </Modal>
 * )}
 */
export function useModalState(initialValue: boolean = false) {
    const [isOpen, setIsOpen] = useState(initialValue);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(v => !v), []);

    return { isOpen, open, close, toggle, setIsOpen };
}

/**
 * Hook for managing disclosure state with animation support.
 * Provides isOpen, isAnimating states for enter/exit animations.
 * 
 * @param initialValue - Initial open state (default: false)
 * @param animationDuration - Duration in ms for exit animation (default: 200)
 * @returns Object with states and action functions
 * 
 * @example
 * const disclosure = useDisclosure();
 * 
 * <button onClick={disclosure.toggle}>Toggle</button>
 * {disclosure.isOpen && (
 *   <div className={disclosure.isAnimating ? 'animate-fadeOut' : 'animate-fadeIn'}>
 *     Content
 *   </div>
 * )}
 */
export function useDisclosure(initialValue: boolean = false, animationDuration: number = 200) {
    const [isOpen, setIsOpen] = useState(initialValue);
    const [isAnimating, setIsAnimating] = useState(false);

    const open = useCallback(() => {
        setIsAnimating(false);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsAnimating(false);
        }, animationDuration);
    }, [animationDuration]);

    const toggle = useCallback(() => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    }, [isOpen, open, close]);

    return { isOpen, isAnimating, open, close, toggle };
}
