"use client";

import React, { createContext, useContext, useReducer, useCallback, type ReactNode, type Dispatch } from "react";
import { type MealHistoryItem, type TabType } from "@/types/dashboard.types";

// ============================================================================
// State Types
// ============================================================================

interface DashboardState {
    /** Current active tab */
    activeTab: TabType;
    /** Selected meal for detail view */
    selectedMeal: MealHistoryItem | null;
    /** Whether the add meal modal is open */
    isAddMealModalOpen: boolean;
    /** Whether the profile edit modal is open */
    isProfileEditModalOpen: boolean;
    /** Mode for add meal modal */
    addMealMode: "camera" | "gallery" | "voice";
    /** File for add meal modal (from camera) */
    addMealFile: File | null;
}

// ============================================================================
// Action Types
// ============================================================================

type DashboardAction =
    | { type: "SET_TAB"; payload: TabType }
    | { type: "SELECT_MEAL"; payload: MealHistoryItem | null }
    | { type: "OPEN_ADD_MEAL_MODAL"; payload: { mode?: "camera" | "gallery" | "voice"; file?: File } }
    | { type: "CLOSE_ADD_MEAL_MODAL" }
    | { type: "OPEN_PROFILE_EDIT_MODAL" }
    | { type: "CLOSE_PROFILE_EDIT_MODAL" }
    | { type: "RESET" };

// ============================================================================
// Initial State
// ============================================================================

const initialState: DashboardState = {
    activeTab: "home",
    selectedMeal: null,
    isAddMealModalOpen: false,
    isProfileEditModalOpen: false,
    addMealMode: "camera",
    addMealFile: null,
};

// ============================================================================
// Reducer
// ============================================================================

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
    switch (action.type) {
        case "SET_TAB":
            return {
                ...state,
                activeTab: action.payload,
                // Reset selected meal when changing tabs
                selectedMeal: null,
            };

        case "SELECT_MEAL":
            return {
                ...state,
                selectedMeal: action.payload,
            };

        case "OPEN_ADD_MEAL_MODAL":
            return {
                ...state,
                isAddMealModalOpen: true,
                addMealMode: action.payload.mode || "camera",
                addMealFile: action.payload.file || null,
            };

        case "CLOSE_ADD_MEAL_MODAL":
            return {
                ...state,
                isAddMealModalOpen: false,
                addMealFile: null,
            };

        case "OPEN_PROFILE_EDIT_MODAL":
            return {
                ...state,
                isProfileEditModalOpen: true,
            };

        case "CLOSE_PROFILE_EDIT_MODAL":
            return {
                ...state,
                isProfileEditModalOpen: false,
            };

        case "RESET":
            return initialState;

        default:
            return state;
    }
}

// ============================================================================
// Context
// ============================================================================

interface DashboardContextValue {
    state: DashboardState;
    dispatch: Dispatch<DashboardAction>;
    // Convenience action creators
    actions: {
        setTab: (tab: TabType) => void;
        selectMeal: (meal: MealHistoryItem | null) => void;
        openAddMealModal: (options?: { mode?: "camera" | "gallery" | "voice"; file?: File }) => void;
        closeAddMealModal: () => void;
        openProfileEditModal: () => void;
        closeProfileEditModal: () => void;
        reset: () => void;
    };
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface DashboardProviderProps {
    children: ReactNode;
    /** Optional initial tab */
    initialTab?: TabType;
}

export function DashboardProvider({ children, initialTab = "home" }: DashboardProviderProps) {
    const [state, dispatch] = useReducer(dashboardReducer, {
        ...initialState,
        activeTab: initialTab,
    });

    // Memoized action creators for convenience
    const actions = {
        setTab: useCallback((tab: TabType) => {
            dispatch({ type: "SET_TAB", payload: tab });
        }, []),

        selectMeal: useCallback((meal: MealHistoryItem | null) => {
            dispatch({ type: "SELECT_MEAL", payload: meal });
        }, []),

        openAddMealModal: useCallback((options?: { mode?: "camera" | "gallery" | "voice"; file?: File }) => {
            dispatch({ type: "OPEN_ADD_MEAL_MODAL", payload: options || {} });
        }, []),

        closeAddMealModal: useCallback(() => {
            dispatch({ type: "CLOSE_ADD_MEAL_MODAL" });
        }, []),

        openProfileEditModal: useCallback(() => {
            dispatch({ type: "OPEN_PROFILE_EDIT_MODAL" });
        }, []),

        closeProfileEditModal: useCallback(() => {
            dispatch({ type: "CLOSE_PROFILE_EDIT_MODAL" });
        }, []),

        reset: useCallback(() => {
            dispatch({ type: "RESET" });
        }, []),
    };

    return (
        <DashboardContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </DashboardContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access dashboard state and actions
 * 
 * @example
 * const { state, actions } = useDashboard();
 * 
 * // Read state
 * const { activeTab, selectedMeal } = state;
 * 
 * // Call actions
 * actions.setTab("history");
 * actions.selectMeal(meal);
 * actions.openAddMealModal({ mode: "voice" });
 */
export function useDashboard() {
    const context = useContext(DashboardContext);

    if (!context) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }

    return context;
}

// ============================================================================
// Selector Hooks (for fine-grained updates)
// ============================================================================

/**
 * Hook to access only the active tab
 */
export function useActiveTab() {
    const { state, actions } = useDashboard();
    return { activeTab: state.activeTab, setTab: actions.setTab };
}

/**
 * Hook to access only the selected meal
 */
export function useSelectedMeal() {
    const { state, actions } = useDashboard();
    return { selectedMeal: state.selectedMeal, selectMeal: actions.selectMeal };
}

/**
 * Hook to access add meal modal state
 */
export function useAddMealModal() {
    const { state, actions } = useDashboard();
    return {
        isOpen: state.isAddMealModalOpen,
        mode: state.addMealMode,
        file: state.addMealFile,
        open: actions.openAddMealModal,
        close: actions.closeAddMealModal,
    };
}

/**
 * Hook to access profile edit modal state
 */
export function useProfileEditModal() {
    const { state, actions } = useDashboard();
    return {
        isOpen: state.isProfileEditModalOpen,
        open: actions.openProfileEditModal,
        close: actions.closeProfileEditModal,
    };
}
