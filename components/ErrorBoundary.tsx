"use client";

import React from "react";

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * ErrorBoundary component to catch JavaScript errors in child component tree.
 * Prevents the entire app from crashing when a component fails.
 * 
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * 
 * @example with custom fallback
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <DashboardContent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
        // Example: Sentry.captureException(error, { extra: errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div
                    role="alert"
                    className="min-h-screen bg-slate-50 flex items-center justify-center p-6"
                >
                    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
                        <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-rose-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-black text-slate-800">
                                Algo salió mal
                            </h2>
                            <p className="text-slate-500 text-sm">
                                Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
                            </p>
                            {process.env.NODE_ENV === "development" && this.state.error && (
                                <details className="mt-4 text-left">
                                    <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                                        Detalles del error (solo en desarrollo)
                                    </summary>
                                    <pre className="mt-2 p-3 bg-slate-100 rounded-xl text-xs text-rose-600 overflow-auto max-h-40">
                                        {this.state.error.message}
                                        {"\n\n"}
                                        {this.state.error.stack}
                                    </pre>
                                </details>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={this.handleReset}
                                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 hover:bg-emerald-400 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
                            >
                                Intentar de nuevo
                            </button>
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="w-full py-3 text-slate-500 font-bold text-xs uppercase tracking-widest transition-all duration-200 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded-xl"
                            >
                                Recargar página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
