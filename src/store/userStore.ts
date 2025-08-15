import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    User,
    FinancialProfile,
    Portfolio,
    FinancialGoal,
    RiskAssessment,
    Investment,
    InvestmentRecommendation,
    FinancialProfileForm,
    GoalForm,
} from '@/types';

interface UserState {
    user: User | null;
    financialProfile: FinancialProfile | null;
    portfolio: Portfolio | null;
    goals: FinancialGoal[];
    riskAssessment: RiskAssessment | null;
    recommendations: InvestmentRecommendation[];
    isLoading: boolean;
    error: string | null;
}

interface UserActions {
    setUser: (user: User) => void;
    updateUser: (updates: Partial<User>) => void;
    updateFinancialProfile: (profile: FinancialProfileForm) => Promise<void>;
    updatePortfolio: (portfolio: Portfolio) => void;
    addGoal: (goal: GoalForm) => Promise<void>;
    updateGoal: (goalId: string, updates: Partial<FinancialGoal>) => void;
    deleteGoal: (goalId: string) => void;
    setRiskAssessment: (assessment: RiskAssessment) => void;
    addInvestment: (investment: Investment) => void;
    updateInvestment: (investmentId: string, updates: Partial<Investment>) => void;
    setRecommendations: (recommendations: InvestmentRecommendation[]) => void;
    clearError: () => void;
    resetUserData: () => void;
}

type UserStore = UserState & UserActions;

const initialState: UserState = {
    user: null,
    financialProfile: null,
    portfolio: null,
    goals: [],
    riskAssessment: null,
    recommendations: [],
    isLoading: false,
    error: null,
};

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            setUser: (user: User) => {
                set({ user });
            },

            updateUser: (updates: Partial<User>) => {
                const { user } = get();
                if (user) {
                    set({
                        user: {
                            ...user,
                            ...updates,
                            updatedAt: new Date(),
                        },
                    });
                }
            },

            updateFinancialProfile: async (profileData: FinancialProfileForm) => {
                set({ isLoading: true, error: null });

                try {
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const { user } = get();
                    if (!user) throw new Error('User not found');

                    const updatedProfile: FinancialProfile = {
                        userId: user.id,
                        ...profileData,
                        existingInvestments: get().portfolio?.investments || [],
                        updatedAt: new Date(),
                    };

                    set({
                        financialProfile: updatedProfile,
                        isLoading: false,
                    });

                    // Update user's monthly income and savings
                    get().updateUser({
                        monthlyIncome: profileData.monthlyIncome,
                        monthlySavings: profileData.monthlyIncome - profileData.monthlyExpenses,
                    });

                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to update profile',
                    });
                    throw error;
                }
            },

            updatePortfolio: (portfolio: Portfolio) => {
                set({ portfolio });
            },

            addGoal: async (goalData: GoalForm) => {
                set({ isLoading: true, error: null });

                try {
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 800));

                    const { user, goals } = get();
                    if (!user) throw new Error('User not found');

                    const newGoal: FinancialGoal = {
                        id: Date.now().toString(),
                        userId: user.id,
                        ...goalData,
                        currentAmount: 0,
                        progress: 0,
                        isActive: true,
                        createdAt: new Date(),
                    };

                    set({
                        goals: [...goals, newGoal],
                        isLoading: false,
                    });

                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to add goal',
                    });
                    throw error;
                }
            },

            updateGoal: (goalId: string, updates: Partial<FinancialGoal>) => {
                const { goals } = get();
                const updatedGoals = goals.map(goal =>
                    goal.id === goalId ? { ...goal, ...updates } : goal
                );
                set({ goals: updatedGoals });
            },

            deleteGoal: (goalId: string) => {
                const { goals } = get();
                const filteredGoals = goals.filter(goal => goal.id !== goalId);
                set({ goals: filteredGoals });
            },

            setRiskAssessment: (assessment: RiskAssessment) => {
                set({ riskAssessment: assessment });

                // Update user's risk tolerance
                get().updateUser({
                    riskTolerance: assessment.tolerance,
                });
            },

            addInvestment: (investment: Investment) => {
                const { portfolio } = get();
                if (portfolio) {
                    const updatedInvestments = [...portfolio.investments, investment];
                    const updatedPortfolio: Portfolio = {
                        ...portfolio,
                        investments: updatedInvestments,
                        totalInvestment: updatedInvestments.reduce((sum, inv) => sum + inv.amount, 0),
                        totalValue: updatedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0),
                        lastUpdated: new Date(),
                    };
                    set({ portfolio: updatedPortfolio });
                }
            },

            updateInvestment: (investmentId: string, updates: Partial<Investment>) => {
                const { portfolio } = get();
                if (portfolio) {
                    const updatedInvestments = portfolio.investments.map(investment =>
                        investment.id === investmentId ? { ...investment, ...updates } : investment
                    );
                    const updatedPortfolio: Portfolio = {
                        ...portfolio,
                        investments: updatedInvestments,
                        totalInvestment: updatedInvestments.reduce((sum, inv) => sum + inv.amount, 0),
                        totalValue: updatedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0),
                        lastUpdated: new Date(),
                    };
                    set({ portfolio: updatedPortfolio });
                }
            },

            setRecommendations: (recommendations: InvestmentRecommendation[]) => {
                set({ recommendations });
            },

            clearError: () => {
                set({ error: null });
            },

            resetUserData: () => {
                set(initialState);
            },
        }),
        {
            name: 'user-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                financialProfile: state.financialProfile,
                portfolio: state.portfolio,
                goals: state.goals,
                riskAssessment: state.riskAssessment,
            }),
        }
    )
);

