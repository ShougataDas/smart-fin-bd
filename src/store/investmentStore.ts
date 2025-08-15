import { create } from 'zustand';
import { Investment, InvestmentRecommendation, FinancialProfile, RiskAssessment, InvestmentType, InvestmentStatus, InvestmentExperience } from '../types';
import { InvestmentRecommendationService } from '../services/investmentRecommendation';
import { logger } from '@utils/logger'; // Corrected to use alias

interface InvestmentState {
    investments: Investment[];
    recommendations: InvestmentRecommendation[];
    isLoading: boolean;
    error: string | null;

    fetchInvestments: () => Promise<void>;
    addInvestment: (investment: Investment) => Promise<void>;
    updateInvestment: (investment: Investment) => Promise<void>;
    deleteInvestment: (id: string) => Promise<void>;
    generateRecommendations: (profile: FinancialProfile, riskAssessment: RiskAssessment) => Promise<void>;
}

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
    investments: [],
    recommendations: [],
    isLoading: false,
    error: null,

    fetchInvestments: async () => {
        set({ isLoading: true, error: null });
        try {
            // In a real app, this would be an API call
            const dummyInvestments: Investment[] = [
                {
                    id: '1',
                    userId: 'user123',
                    name: '5-Year Sanchayapatra',
                    type: InvestmentType.SANCHAYAPATRA,
                    amount: 100000,
                    currentValue: 108500,
                    expectedReturn: 8.5,
                    startDate: new Date('2023-01-01'),
                    maturityDate: new Date('2028-01-01'),
                    status: InvestmentStatus.ACTIVE,
                    details: { institution: 'Bangladesh Bank', interestRate: 8.5 },
                    performance: { monthlyReturns: [], lastUpdated: new Date() },
                    notifications: { maturityReminder: true, performanceAlerts: true },
                    isActive: true,
                    createdAt: new Date('2023-01-01'),
                    updatedAt: new Date('2024-01-15'),
                },
                {
                    id: '2',
                    userId: 'user123',
                    name: 'Monthly DPS',
                    type: InvestmentType.DPS,
                    amount: 60000,
                    currentValue: 65000,
                    expectedReturn: 7.2,
                    startDate: new Date('2023-03-01'),
                    maturityDate: new Date('2028-03-01'),
                    status: InvestmentStatus.ACTIVE,
                    details: { monthlyInstallment: 1000, totalInstallments: 60, installmentsPaid: 10, institution: 'Sonali Bank' },
                    performance: { monthlyReturns: [], lastUpdated: new Date() },
                    notifications: { maturityReminder: true, performanceAlerts: true },
                    isActive: true,
                    createdAt: new Date('2023-03-01'),
                    updatedAt: new Date('2024-01-15'),
                },
            ];
            set({ investments: dummyInvestments, isLoading: false });
        } catch (err) {
            logger.error('Failed to fetch investments:', err);
            set({ error: 'Failed to load investments', isLoading: false });
        }
    },

    addInvestment: async (investment: Investment) => {
        set({ isLoading: true, error: null });
        try {
            // In a real app, this would be an API call
            set((state) => ({
                investments: [...state.investments, investment],
                isLoading: false,
            }));
        } catch (err) {
            logger.error('Failed to add investment:', err);
            set({ error: 'Failed to add investment', isLoading: false });
        }
    },

    updateInvestment: async (updatedInvestment: Investment) => {
        set({ isLoading: true, error: null });
        try {
            // In a real app, this would be an API call
            set((state) => ({
                investments: state.investments.map((inv) =>
                    inv.id === updatedInvestment.id ? updatedInvestment : inv
                ),
                isLoading: false,
            }));
        } catch (err) {
            logger.error('Failed to update investment:', err);
            set({ error: 'Failed to update investment', isLoading: false });
        }
    },

    deleteInvestment: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            // In a real app, this would be an API call
            set((state) => ({
                investments: state.investments.filter((inv) => inv.id !== id),
                isLoading: false,
            }));
        } catch (err) {
            logger.error('Failed to delete investment:', err);
            set({ error: 'Failed to delete investment', isLoading: false });
        }
    },

    generateRecommendations: async (profile: FinancialProfile, riskAssessment: RiskAssessment) => {
        set({ isLoading: true, error: null });
        try {
            // You need to provide a User object here. Replace the dummyUser with the actual user from your state or context.
            const dummyUser = {
                id: 'user123',
                name: 'Demo User',
                age: 30,
                email: 'demo@example.com',
                phone: '0123456789',
                monthlyIncome: 50000,
                monthlySavings: 10000,
                occupation: 'Engineer',
                maritalStatus: 'Single',
                dependents: 0,
                location: 'Dhaka',
                riskTolerance: riskAssessment.tolerance,
                totalInvestment: 0,
                investmentExperience: InvestmentExperience.BEGINNER,
                financialGoals: [],
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2024-01-15')
            };
            const recommendations = InvestmentRecommendationService.generateRecommendations(dummyUser, profile, riskAssessment);
            set({ recommendations, isLoading: false });
        } catch (err) {
            logger.error('Failed to generate recommendations:', err);
            set({ error: 'Failed to generate recommendations', isLoading: false });
        }
    },
}));
