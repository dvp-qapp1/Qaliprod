import type { Locale } from '../config/locales';

/**
 * Dictionary structure for all translatable content.
 * Organized by feature/section.
 */
export interface Dictionary {
    common: {
        loading: string;
        error: string;
        save: string;
        cancel: string;
        back: string;
        next: string;
        or: string;
    };
    nav: {
        login: string;
        signup: string;
        logout: string;
    };
    landing: {
        hero: {
            badge: string;
            title: string;
            description: string;
            cta: string;
        };
        howItWorks: {
            title: string;
            step1: { title: string; description: string };
            step2: { title: string; description: string };
            step3: { title: string; description: string };
        };
        features: {
            badge: string;
            title: string;
            subtitle: string;
            photoAnalysis: { badge: string; title: string; description: string };
            alerts: { badge: string; title: string; description: string };
            kiliCoach: { badge: string; title: string; description: string };
            goals: { badge: string; title: string; description: string };
        };
        testimonials: {
            title: string;
            items: Array<{ quote: string; author: string }>;
        };
        cta: {
            badge: string;
            title: string;
            description: string;
            button: string;
        };
        footer: {
            privacy: string;
            terms: string;
            support: string;
        };
    };
    login: {
        title: string;
        subtitle: string;
        googleButton: string;
        emailLabel: string;
        passwordLabel: string;
        submitButton: string;
        loadingButton: string;
        noAccount: string;
        createAccount: string;
    };
    signup: {
        title: string;
        subtitle: string;
        googleButton: string;
        nameLabel: string;
        emailLabel: string;
        passwordLabel: string;
        submitButton: string;
        loadingButton: string;
        hasAccount: string;
        loginLink: string;
    };
    dashboard: {
        loading: string;
        scannerLoading: string;
        coachLoading: string;
        errorLoading: string;
        tabs: {
            home: string;
            history: string;
            scanner: string;
            coach: string;
            profile: string;
            alacena: string;
        };
        home: {
            greeting: string;
            registrosLabel: string;
            registrosValue: string;
            synced: string;
            goalLabel: string;
            noGoal: string;
            caloriesRemaining: string;
            todayProgress: string;
            coachTitle: string;
            coachQuestion: string;
            photo: string;
            voice: string;
            text: string;
            scanPhoto: string;
            scanVoice: string;
            alacena: string;
            pantryTitle: string;
            pantryEmpty: string;
            pantryScan: string;
            pantryUpdate: string;
            pantryViewAll: string;
            pantryCategories: {
                abarrotes: string;
                congelados: string;
                refrigerados: string;
                frutas_verduras: string;
                snacks_dulces: string;
                bebidas: string;
                especias_condimentos: string;
                panaderia_reposteria: string;
                otros: string;
            };
        };
        alacena: {
            addIngredients: string;
            selectAll: string;
            selected: string;
            clear: string;
            allCategories: string;
            searchPlaceholder: string;
            scanNow: string;
            noResults: string;
            editProduct: string;
            ingredientNamePlaceholder: string;
            quantityLabel: string;
            unitLabel: string;
            quantityPlaceholder: string;
            saveChanges: string;
            deleteProduct: string;
            deleteTitle: string;
            deleteMessage1: string;
            deleteMessage2: string;
            confirmDelete: string;
            cancelDelete: string;
            generating: string;
            generateRecipe: string;
            original: string;
            defaultUnit: string;
            unitGrams: string;
            unitUnits: string;
            unitMl: string;
            unitLiters: string;
            unitKg: string;
        };
        history: {
            title: string;
            noMeals: string;
            scanFirst: string;
            today: string;
        };
        scanner: {
            photo: string;
            voice: string;
            text: string;
            takePhoto: string;
            chooseGallery: string;
            imageFormats: string;
            voiceTitle: string;
            voiceDescription: string;
            textPlaceholder: string;
            analyzeButton: string;
            textHint: string;
            analyzing: string;
            analyzingQuote: string;
            analyzingStepMeal1: string;
            analyzingStepMeal2: string;
            analyzingStepMeal3: string;
            analyzingStepMeal4: string;
            analyzingStepMeal5: string;
            analyzingStepPantry1: string;
            analyzingStepPantry2: string;
            analyzingStepPantry3: string;
            analyzingStepPantry4: string;
            analyzingStepPantry5: string;
            finalizingStep1: string;
            finalizingStep2: string;
            finalizingStep3: string;
            finalizingStep4: string;
            finalizingStep5: string;
            saveButton: string;
            savingButton: string;
            discardButton: string;
            pendingSave: string;
            cancel: string;
            frameYourPlate: string;
            portionTitle: string;
            portionSubtitle: string;
            portionSmall: string;
            portionMedium: string;
            portionLarge: string;
            portionExtraLarge: string;
            portionSmallPlate: string;
            portionMediumPlate: string;
            portionLargePlate: string;
            portionExtraLargePlate: string;
            portionSmallGrams: string;
            portionMediumGrams: string;
            portionLargeGrams: string;
            portionExtraLargeGrams: string;
            portionSmallComparison: string;
            portionMediumComparison: string;
            portionLargeComparison: string;
            portionExtraLargeComparison: string;
            portionTip: string;
            analyzePortion: string;
            previewAlt: string;
            speakNowIos: string;
            speakNow: string;
            pressToStart: string;
            stopRecording: string;
            continueRecording: string;
            startRecording: string;
            reviewAndAnalyze: string;
            micProblems: string;
            useTextMode: string;
            didYouMean: string;
            yesAnalyze: string;
            noCorrectText: string;
            agreeWithAnalysis: string;
            editHint: string;
            pendingEstimate: string;
            addExtra: string;
            foodPlaceholder: string;
            kcalPlaceholder: string;
            addButton: string;
            confirmMeal: string;
            mealTimeTitle: string;
            mealTimeHint: string;
            breakfast: string;
            lunch: string;
            dinner: string;
            snack: string;
            safeLabel: string;
            alertLabel: string;
            estimatedEnergy: string;
            estimatedPortion: string;
            pantryTakePhoto: string;
            pantryVoiceTitle: string;
            pantryTextPlaceholder: string;
            pantryFrameHint: string;
            pantryConfirm: string;
            pantryEditHint: string;
            introTitle: string;
            introSubtitle: string;
            logMealOption: string;
            logMealDescription: string;
            updatePantryOption: string;
            updatePantryDescription: string;
            ingredients: string;
            kiliTip: string;
            noSpeechSupport: string;
            micPermissionDenied: string;
            voiceErrorIos: string;
            cameraError: string;
            analyzeError: string;
            analyzeImageError: string;
            noFoodDetected: string;
            noFoodInDescription: string;
            saveError: string;
            defaultFeedback: string;
        };
        coach: {
            placeholder: string;
            greeting: string;
            title: string;
            subtitle: string;
            suggestion1: string;
            suggestion2: string;
            suggestion3: string;
            send: string;
            modeCoach: string;
            modeChef: string;
            chefTitle: string;
            chefSubtitle: string;
            chefSuggestion1: string;
            chefSuggestion2: string;
            chefSuggestion3: string;
            chefPlaceholder: string;
            ingredientsTitle: string;
            instructionsTitle: string;
            showRecipe: string;
            hideRecipe: string;
            letsStart: string;
        };
        profile: {
            title: string;
            myInfo: string;
            edit: string;
            age: string;
            ageYears: string;
            gender: string;
            height: string;
            weight: string;
            bmiTitle: string;
            goal: string;
            activity: string;
            allergies: string;
            dietStyle: string;
            logout: string;
            installApp: string;
            editTitle: string;
            saveError: string;
            select: string;
            saving: string;
            activityLabel: string;
            calorieTarget: string;
            profilePicAlt: string;
            bmiCategories: {
                underweight: string;
                normal: string;
                overweight: string;
                obese: string;
            };
            genderOptions: {
                male: string;
                female: string;
                other: string;
            };
            activityLevels: {
                sedentary: string;
                light: string;
                moderate: string;
                active: string;
                very_active: string;
            };
            preferences: {
                title: string;
                language: string;
                theme: string;
                themeLight: string;
                themeDark: string;
                comingSoon: string;
            };
        };
        macros: {
            protein: string;
            carbs: string;
            fat: string;
        };
        chart: {
            remaining: string;
            extra: string;
        };
        goals: {
            lose_weight: string;
            gain_muscle: string;
            maintain: string;
            eat_healthy: string;
        };
        skipToContent: string;
    };
    onboarding: {
        welcome: { title: string; description: string; startButton: string };
        allergies: { title: string; subtitle: string; otherLabel: string; placeholder: string; addAllergyButton: string; noAllergiesButton: string; continueButton: string };
        goals: { title: string; subtitle: string; nextButton: string };
        diet: { title: string; subtitle: string; continueButton: string };
        personal: { title: string; subtitle: string; ageLabel: string; agePlaceholder: string; genderLabel: string; continueButton: string };
        height: { title: string; subtitle: string; hint: string; continueButton: string };
        weight: { title: string; subtitle: string; hint: string; continueButton: string };
        activity: { title: string; subtitle: string; nextButton: string };
        targetCalories: { title: string; subtitle: string; nextButton: string };
        finish: { title: string; successMessage: string; finalizeButton: string };
        genderOptions: {
            male: string;
            female: string;
            other: string;
        };
        activityOptions: {
            sedentary: string;
            light: string;
            moderate: string;
            active: string;
            veryActive: string;
        };
        activityDescriptions: {
            sedentary: string;
            light: string;
            moderate: string;
            active: string;
            veryActive: string;
        };
        goalOptions: {
            loseWeight: string;
            gainMuscle: string;
            maintain: string;
            improveEnergy: string;
            improveDigestion: string;
        };
    };
    bmiCard: {
        calculating: string;
        yourBmi: string;
        yourGoal: string;
        categories: {
            underweight: { label: string; message: string };
            normal: { label: string; message: string };
            overweight: { label: string; message: string };
            obese: { label: string; message: string };
        };
    };
    calorieWidget: {
        title: string;
        recommended: string;
        unit: string;
        goalLabels: {
            lose: string;
            gain: string;
            maintain: string;
            default: string;
        };
        warnings: {
            low: string;
            high: string;
            safe: string;
        };
    };
    installPrompt: {
        title: string;
        subtitle: string;
        iosTitle: string;
        iosStep1: string;
        iosStep2: string;
        gotIt: string;
        notNow: string;
        install: string;
    };
    errors: {
        generic: string;
        network: string;
        unauthorized: string;
        notFound: string;
    };
}

/**
 * Page props with lang param.
 * Uses string type to satisfy Next.js route constraints.
 * Runtime validation should cast to Locale after validation.
 */
export interface LangPageProps {
    params: Promise<{ lang: string }>;
}

/**
 * Layout props with lang param.
 * Uses string type to satisfy Next.js route constraints.
 * Runtime validation should cast to Locale after validation.
 */
export interface LangLayoutProps {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}

