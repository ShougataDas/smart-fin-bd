import mongoose, { Document, Schema } from "mongoose";

export enum InvestmentType {
    SANCHAYAPATRA = "sanchayapatra",
    DPS = "dps",
    FIXED_DEPOSIT = "fixed_deposit",
    MUTUAL_FUND = "mutual_fund",
    STOCK = "stock",
    BOND = "bond",
}

export enum InvestmentStatus {
    ACTIVE = "active",
    MATURED = "matured",
    CLOSED = "closed",
    PENDING = "pending",
}

export interface IInvestment extends Document {
    _id: string;
    userId: string;
    name: string;
    type: InvestmentType;
    amount: number;
    currentValue: number;
    expectedReturn: number;
    actualReturn?: number;
    startDate: Date;
    maturityDate?: Date;
    status: InvestmentStatus;

    // Investment specific details
    details: {
        institution?: string; // Bank, NBFI, etc.
        accountNumber?: string;
        certificateNumber?: string;
        interestRate?: number;
        compoundingFrequency?: "monthly" | "quarterly" | "yearly";

        // For stocks
        symbol?: string;
        quantity?: number;
        purchasePrice?: number;
        currentPrice?: number;

        // For mutual funds
        fundName?: string;
        nav?: number; // Net Asset Value
        units?: number;

        // For DPS
        monthlyInstallment?: number;
        installmentsPaid?: number;
        totalInstallments?: number;
    };

    // Performance tracking
    performance: {
        monthlyReturns: Array<{
            month: Date;
            value: number;
            return: number;
        }>;
        lastUpdated: Date;
    };

    // Risk metrics
    riskMetrics?: {
        volatility?: number;
        beta?: number;
        sharpeRatio?: number;
        maxDrawdown?: number;
    };

    // Notifications
    notifications: {
        maturityReminder: boolean;
        performanceAlerts: boolean;
        lastNotificationSent?: Date;
    };

    notes?: string;
    tags?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const investmentSchema = new Schema<IInvestment>(
    {
        userId: {
            type: String,
            required: [true, "User ID is required"],
            ref: "User",
        },
        name: {
            type: String,
            required: [true, "Investment name is required"],
            trim: true,
            maxlength: [100, "Investment name cannot exceed 100 characters"],
        },
        type: {
            type: String,
            required: [true, "Investment type is required"],
            enum: Object.values(InvestmentType),
        },
        amount: {
            type: Number,
            required: [true, "Investment amount is required"],
            min: [0, "Investment amount cannot be negative"],
        },
        currentValue: {
            type: Number,
            required: [true, "Current value is required"],
            min: [0, "Current value cannot be negative"],
        },
        expectedReturn: {
            type: Number,
            required: [true, "Expected return is required"],
            min: [0, "Expected return cannot be negative"],
            max: [100, "Expected return cannot exceed 100%"],
        },
        actualReturn: {
            type: Number,
            min: [-100, "Actual return cannot be less than -100%"],
        },
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
        },
        maturityDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: Object.values(InvestmentStatus),
            default: InvestmentStatus.ACTIVE,
        },

        // Investment specific details
        details: {
            institution: {
                type: String,
                trim: true,
                maxlength: [100, "Institution name cannot exceed 100 characters"],
            },
            accountNumber: {
                type: String,
                trim: true,
                maxlength: [50, "Account number cannot exceed 50 characters"],
            },
            certificateNumber: {
                type: String,
                trim: true,
                maxlength: [50, "Certificate number cannot exceed 50 characters"],
            },
            interestRate: {
                type: Number,
                min: [0, "Interest rate cannot be negative"],
                max: [100, "Interest rate cannot exceed 100%"],
            },
            compoundingFrequency: {
                type: String,
                enum: ["monthly", "quarterly", "yearly"],
            },

            // For stocks
            symbol: {
                type: String,
                trim: true,
                uppercase: true,
                maxlength: [10, "Stock symbol cannot exceed 10 characters"],
            },
            quantity: {
                type: Number,
                min: [0, "Quantity cannot be negative"],
            },
            purchasePrice: {
                type: Number,
                min: [0, "Purchase price cannot be negative"],
            },
            currentPrice: {
                type: Number,
                min: [0, "Current price cannot be negative"],
            },

            // For mutual funds
            fundName: {
                type: String,
                trim: true,
                maxlength: [100, "Fund name cannot exceed 100 characters"],
            },
            nav: {
                type: Number,
                min: [0, "NAV cannot be negative"],
            },
            units: {
                type: Number,
                min: [0, "Units cannot be negative"],
            },

            // For DPS
            monthlyInstallment: {
                type: Number,
                min: [0, "Monthly installment cannot be negative"],
            },
            installmentsPaid: {
                type: Number,
                min: [0, "Installments paid cannot be negative"],
                default: 0,
            },
            totalInstallments: {
                type: Number,
                min: [1, "Total installments must be at least 1"],
            },
        },

        // Performance tracking
        performance: {
            monthlyReturns: [
                {
                    month: {
                        type: Date,
                        required: true,
                    },
                    value: {
                        type: Number,
                        required: true,
                        min: [0, "Value cannot be negative"],
                    },
                    return: {
                        type: Number,
                        required: true,
                    },
                },
            ],
            lastUpdated: {
                type: Date,
                default: Date.now,
            },
        },

        // Risk metrics
        riskMetrics: {
            volatility: {
                type: Number,
                min: [0, "Volatility cannot be negative"],
            },
            beta: {
                type: Number,
            },
            sharpeRatio: {
                type: Number,
            },
            maxDrawdown: {
                type: Number,
                min: [0, "Max drawdown cannot be negative"],
                max: [100, "Max drawdown cannot exceed 100%"],
            },
        },

        // Notifications
        notifications: {
            maturityReminder: {
                type: Boolean,
                default: true,
            },
            performanceAlerts: {
                type: Boolean,
                default: true,
            },
            lastNotificationSent: {
                type: Date,
            },
        },

        notes: {
            type: String,
            trim: true,
            maxlength: [500, "Notes cannot exceed 500 characters"],
        },
        tags: [
            {
                type: String,
                trim: true,
                maxlength: [30, "Tag cannot exceed 30 characters"],
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Indexes
investmentSchema.index({ userId: 1 });
investmentSchema.index({ type: 1 });
investmentSchema.index({ status: 1 });
investmentSchema.index({ startDate: -1 });
investmentSchema.index({ maturityDate: 1 });
investmentSchema.index({ userId: 1, isActive: 1 });
investmentSchema.index({ userId: 1, type: 1 });

// Virtual for return percentage
investmentSchema.virtual("returnPercentage").get(function () {
    if (this.amount === 0) return 0;
    return ((this.currentValue - this.amount) / this.amount) * 100;
});

// Virtual for days to maturity
investmentSchema.virtual("daysToMaturity").get(function () {
    if (!this.maturityDate) return null;
    const today = new Date();
    const maturity = new Date(this.maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for investment duration in days
investmentSchema.virtual("durationDays").get(function () {
    const today = new Date();
    const start = new Date(this.startDate);
    const diffTime = today.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update current value for certain investment types
investmentSchema.pre("save", function (next) {
    // Auto-calculate current value for DPS
    if (
        this.type === InvestmentType.DPS &&
        this.details.monthlyInstallment &&
        this.details.installmentsPaid
    ) {
        const principal =
            this.details.monthlyInstallment * this.details.installmentsPaid;
        const months = this.details.installmentsPaid;
        const annualRate = this.expectedReturn / 100;
        const monthlyRate = annualRate / 12;

        // Compound interest calculation for DPS
        if (monthlyRate > 0) {
            this.currentValue = principal * Math.pow(1 + monthlyRate, months);
        } else {
            this.currentValue = principal;
        }
    }

    // Auto-calculate current value for stocks
    if (
        this.type === InvestmentType.STOCK &&
        this.details.quantity &&
        this.details.currentPrice
    ) {
        this.currentValue = this.details.quantity * this.details.currentPrice;
    }

    // Auto-calculate current value for mutual funds
    if (
        this.type === InvestmentType.MUTUAL_FUND &&
        this.details.units &&
        this.details.nav
    ) {
        this.currentValue = this.details.units * this.details.nav;
    }

    next();
});

// Method to calculate compound interest
investmentSchema.methods.calculateCompoundInterest = function (
    principal: number,
    rate: number,
    time: number,
    frequency: number = 1
): number {
    return principal * Math.pow(1 + rate / frequency, frequency * time);
};

// Method to add monthly return
investmentSchema.methods.addMonthlyReturn = function (
    month: Date,
    value: number
): void {
    const returnPercentage =
        this.amount > 0 ? ((value - this.amount) / this.amount) * 100 : 0;

    this.performance.monthlyReturns.push({
        month,
        value,
        return: returnPercentage,
    });

    // Keep only last 24 months
    if (this.performance.monthlyReturns.length > 24) {
        this.performance.monthlyReturns =
            this.performance.monthlyReturns.slice(-24);
    }

    this.performance.lastUpdated = new Date();
};

export const Investment = mongoose.model<IInvestment>(
    "Investment",
    investmentSchema
);
