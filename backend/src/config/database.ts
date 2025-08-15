import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartfin-bd';

export const connectDatabase = async (): Promise<void> => {
    try {
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            // family: 4, // Optional: only if you need IPv4
        };

        await mongoose.connect(MONGODB_URI, options);

        logger.info('✅ MongoDB connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            logger.error('❌ MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('🔄 MongoDB reconnected');
        });

    } catch (error) {
        logger.error('❌ MongoDB connection failed:', error);
        throw error;
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        logger.info('✅ MongoDB disconnected successfully');
    } catch (error) {
        logger.error('❌ MongoDB disconnection failed:', error);
        throw error;
    }
};