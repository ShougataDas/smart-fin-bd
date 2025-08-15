import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    password: string;
    age: number;
    gender?: "male" | "female" | "other";
    occupation?: string;
    profilePicture?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    // Financial Profile
    financialProfile?: {
        monthlyIncome: number;
        monthlyExpenses: number;
        currentSavings: number;
        dependents: number;
        employmentType:
        | "government"
        | "private"
        | "business"
        | "freelance"
        | "student"
        | "retired";
        incomeStability: "stable" | "variable" | "irregular";
        hasInsurance: boolean;
        hasEmergencyFund: boolean;
        debtAmount?: number;
        financialGoals: string[];
    };

    // Risk Assessment
    riskAssessment?: {
        riskTolerance: "conservative" | "moderate" | "aggressive";
        investmentExperience: "beginner" | "intermediate" | "advanced";
        investmentHorizon: "short" | "medium" | "long"; // <2 years, 2-5 years, >5 years
        liquidityNeeds: "high" | "medium" | "low";
        assessmentScore: number; // 0-100
        completedAt?: Date;
    };

    // Preferences
    preferences: {
        language: "bn" | "en";
        currency: "BDT";
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
            marketUpdates: boolean;
            investmentReminders: boolean;
            portfolioAlerts: boolean;
        };
        theme: "light" | "dark" | "auto";
    };

    // Methods
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(): string;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email",
            ],
        },
        phone: {
            type: String,
            trim: true,
            match: [
                /^(\+88)?01[3-9]\d{8}$/,
                "Please enter a valid Bangladeshi phone number",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false, // Don't include password in queries by default
        },
        age: {
            type: Number,
            required: [true, "Age is required"],
            min: [18, "Must be at least 18 years old"],
            max: [100, "Age cannot exceed 100"],
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },
        occupation: {
            type: String,
            trim: true,
            maxlength: [100, "Occupation cannot exceed 100 characters"],
        },
        profilePicture: {
            type: String,
            trim: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isPhoneVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLoginAt: {
            type: Date,
        },

        // Financial Profile
        financialProfile: {
            monthlyIncome: {
                type: Number,
                min: [0, "Monthly income cannot be negative"],
            },
            monthlyExpenses: {
                type: Number,
                min: [0, "Monthly expenses cannot be negative"],
            },
            currentSavings: {
                type: Number,
                min: [0, "Current savings cannot be negative"],
            },
            dependents: {
                type: Number,
                min: [0, "Dependents cannot be negative"],
                max: [20, "Dependents cannot exceed 20"],
            },
            employmentType: {
                type: String,
                enum: [
                    "government",
                    "private",
                    "business",
                    "freelance",
                    "student",
                    "retired",
                ],
            },
            incomeStability: {
                type: String,
                enum: ["stable", "variable", "irregular"],
            },
            hasInsurance: {
                type: Boolean,
                default: false,
            },
            hasEmergencyFund: {
                type: Boolean,
                default: false,
            },
            debtAmount: {
                type: Number,
                min: [0, "Debt amount cannot be negative"],
            },
            financialGoals: [
                {
                    type: String,
                    trim: true,
                },
            ],
        },

        // Risk Assessment
        riskAssessment: {
            riskTolerance: {
                type: String,
                enum: ["conservative", "moderate", "aggressive"],
            },
            investmentExperience: {
                type: String,
                enum: ["beginner", "intermediate", "advanced"],
            },
            investmentHorizon: {
                type: String,
                enum: ["short", "medium", "long"],
            },
            liquidityNeeds: {
                type: String,
                enum: ["high", "medium", "low"],
            },
            assessmentScore: {
                type: Number,
                min: [0, "Assessment score cannot be less than 0"],
                max: [100, "Assessment score cannot exceed 100"],
            },
            completedAt: {
                type: Date,
            },
        },

        // Preferences
        preferences: {
            language: {
                type: String,
                enum: ["bn", "en"],
                default: "bn",
            },
            currency: {
                type: String,
                default: "BDT",
            },
            notifications: {
                email: {
                    type: Boolean,
                    default: true,
                },
                push: {
                    type: Boolean,
                    default: true,
                },
                sms: {
                    type: Boolean,
                    default: false,
                },
                marketUpdates: {
                    type: Boolean,
                    default: true,
                },
                investmentReminders: {
                    type: Boolean,
                    default: true,
                },
                portfolioAlerts: {
                    type: Boolean,
                    default: true,
                },
            },
            theme: {
                type: String,
                enum: ["light", "dark", "auto"],
                default: "light",
            },
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate auth token
userSchema.methods.generateAuthToken = function (): string {
    const jwt = require("jsonwebtoken");
    return jwt.sign(
        {
            userId: this._id,
            email: this.email,
            name: this.name,
        },
        process.env.JWT_SECRET || "fallback-secret",
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        }
    );
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
    return this.name;
});

// Virtual for portfolio value (to be populated from investments)
userSchema.virtual("portfolioValue", {
    ref: "Investment",
    localField: "_id",
    foreignField: "userId",
    justOne: false,
});

export const User = mongoose.model<IUser>("User", userSchema);
