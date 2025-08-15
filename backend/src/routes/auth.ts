import express from "express";
import jwt from "jsonwebtoken";
import Joi from "joi";
import { User } from "../models/User";
import { logger } from "../utils/logger";
import { sendEmail } from "../utils/email";
import { sendSMS } from "../utils/sms";

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string()
        .pattern(/^(\+88)?01[3-9]\d{8}$/)
        .optional(),
    password: Joi.string().min(8).required(),
    age: Joi.number().min(18).max(100).required(),
    gender: Joi.string().valid("male", "female", "other").optional(),
    occupation: Joi.string().max(100).optional(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
});

const verifyEmailSchema = Joi.object({
    token: Joi.string().required(),
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", async (req, res) => {
    try {
        // Validate request body
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.details.map((detail) => detail.message),
            });
        }

        const { name, email, phone, password, age, gender, occupation } = value;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, ...(phone ? [{ phone }] : [])],
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists with this email or phone number",
            });
        }

        // Create new user
        const user = new User({
            name,
            email,
            phone,
            password,
            age,
            gender,
            occupation,
            preferences: {
                language: "bn",
                currency: "BDT",
                notifications: {
                    email: true,
                    push: true,
                    sms: false,
                    marketUpdates: true,
                    investmentReminders: true,
                    portfolioAlerts: true,
                },
                theme: "light",
            },
        });

        await user.save();

        // Generate auth token
        const token = user.generateAuthToken();

        // Generate email verification token
        const emailVerificationToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || "fallback-secret",
            { expiresIn: "24h" }
        );

        // Send verification email
        try {
            await sendEmail({
                to: user.email,
                subject: "SmartFin BD - ইমেইল যাচাই করুন",
                template: "email-verification",
                data: {
                    name: user.name,
                    verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`,
                },
            });
        } catch (emailError) {
            logger.error("Failed to send verification email:", emailError);
        }

        logger.info(`New user registered: ${user.email}`);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    age: user.age,
                    isEmailVerified: user.isEmailVerified,
                    isPhoneVerified: user.isPhoneVerified,
                },
                token,
            },
        });
    } catch (error) {
        logger.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", async (req, res) => {
    try {
        // Validate request body
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.details.map((detail) => detail.message),
            });
        }

        const { email, password } = value;

        // Find user and include password for comparison
        const user = await User.findOne({ email, isActive: true }).select(
            "+password"
        );
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Generate auth token
        const token = user.generateAuthToken();

        logger.info(`User logged in: ${user.email}`);

        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    age: user.age,
                    isEmailVerified: user.isEmailVerified,
                    isPhoneVerified: user.isPhoneVerified,
                    financialProfile: user.financialProfile,
                    riskAssessment: user.riskAssessment,
                    preferences: user.preferences,
                },
                token,
            },
        });
    } catch (error) {
        logger.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post("/forgot-password", async (req, res) => {
    try {
        // Validate request body
        const { error, value } = forgotPasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.details.map((detail) => detail.message),
            });
        }

        const { email } = value;

        // Find user
        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            // Don't reveal if user exists or not
            return res.json({
                success: true,
                message:
                    "If an account with that email exists, a password reset link has been sent.",
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || "fallback-secret",
            { expiresIn: "1h" }
        );

        // Send reset email
        try {
            await sendEmail({
                to: user.email,
                subject: "SmartFin BD - পাসওয়ার্ড রিসেট",
                template: "password-reset",
                data: {
                    name: user.name,
                    resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
                },
            });
        } catch (emailError) {
            logger.error("Failed to send reset email:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send reset email",
            });
        }

        logger.info(`Password reset requested for: ${user.email}`);

        res.json({
            success: true,
            message:
                "If an account with that email exists, a password reset link has been sent.",
        });
    } catch (error) {
        logger.error("Forgot password error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password", async (req, res) => {
    try {
        // Validate request body
        const { error, value } = resetPasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.details.map((detail) => detail.message),
            });
        }

        const { token, password } = value;

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "fallback-secret"
            ) as any;
        } catch (jwtError) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset token",
            });
        }

        // Update password
        user.password = password;
        await user.save();

        logger.info(`Password reset completed for: ${user.email}`);

        res.json({
            success: true,
            message: "Password reset successful",
        });
    } catch (error) {
        logger.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post("/verify-email", async (req, res) => {
    try {
        // Validate request body
        const { error, value } = verifyEmailSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.details.map((detail) => detail.message),
            });
        }

        const { token } = value;

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "fallback-secret"
            ) as any;
        } catch (jwtError) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token",
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification token",
            });
        }

        // Update email verification status
        user.isEmailVerified = true;
        await user.save();

        logger.info(`Email verified for: ${user.email}`);

        res.json({
            success: true,
            message: "Email verified successfully",
        });
    } catch (error) {
        logger.error("Email verification error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        // Find user
        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }

        // Generate new verification token
        const emailVerificationToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || "fallback-secret",
            { expiresIn: "24h" }
        );

        // Send verification email
        try {
            await sendEmail({
                to: user.email,
                subject: "SmartFin BD - ইমেইল যাচাই করুন",
                template: "email-verification",
                data: {
                    name: user.name,
                    verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`,
                },
            });
        } catch (emailError) {
            logger.error("Failed to send verification email:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send verification email",
            });
        }

        res.json({
            success: true,
            message: "Verification email sent successfully",
        });
    } catch (error) {
        logger.error("Resend verification error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export default router;
