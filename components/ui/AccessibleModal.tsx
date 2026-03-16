"use client";

import React, { useEffect, useRef, useCallback } from "react";

interface AccessibleModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when modal should close */
    onClose: () => void;
    /** Modal content */
    children: React.ReactNode;
    /** Accessible title for screen readers */
    title: string;
    /** Optional: Custom max width class (default: max-w-md) */
    maxWidth?: string;
    /** Optional: Whether to show close button (default: false - content should have its own) */
    showCloseButton?: boolean;
}

/**
 * Accessible modal component following WAI-ARIA best practices.
 * Features:
 * - Focus trap (focus stays inside modal)
 * - Focus restoration (returns focus to trigger element on close)
 * - Escape to close
 * - Click outside to close
 * - Screen reader announcements (role="dialog", aria-modal, aria-labelledby)
 * 
 * @example
 * <AccessibleModal 
 *   isOpen={isOpen} 
 *   onClose={() => setIsOpen(false)}
 *   title="Detalles de comida"
 * >
 *   <ModalContent />
 * </AccessibleModal>
 */
export function AccessibleModal({
    isOpen,
    onClose,
    children,
    title,
    maxWidth = "max-w-md",
    showCloseButton = false,
}: AccessibleModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Handle keyboard events (Escape + Tab trap)
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Close on Escape
        if (e.key === "Escape") {
            onClose();
            return;
        }

        // Trap focus inside modal
        if (e.key === "Tab" && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            const focusableArray = Array.from(focusableElements);
            if (focusableArray.length === 0) return;

            const firstElement = focusableArray[0];
            const lastElement = focusableArray[focusableArray.length - 1];

            if (e.shiftKey) {
                // Shift + Tab: If on first element, go to last
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                // Tab: If on last element, go to first
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    }, [onClose]);

    // Focus management
    useEffect(() => {
        if (isOpen) {
            // Save currently focused element
            previousFocusRef.current = document.activeElement as HTMLElement;

            // Focus the modal container only on initial open
            // This prevents stealing focus from inputs inside the modal on re-renders
            if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
                modalRef.current.focus();
            }

            // Prevent body scroll
            document.body.style.overflow = "hidden";

            // Add keyboard listener
            document.addEventListener("keydown", handleKeyDown);

            return () => {
                document.removeEventListener("keydown", handleKeyDown);
                document.body.style.overflow = "";
            };
        } else {
            // Restore focus when closing
            previousFocusRef.current?.focus();
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabIndex={-1}
                className={`relative bg-white w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl animate-fadeInUp no-scrollbar focus:outline-none`}
            >
                {/* Screen-reader only title */}
                <h2 id="modal-title" className="sr-only">
                    {title}
                </h2>

                {/* Optional close button */}
                {showCloseButton && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {children}
            </div>
        </div>
    );
}
