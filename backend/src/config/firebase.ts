import admin from "firebase-admin";
import { logger } from "../utils/logger";

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = async (): Promise<void> => {
    try {
        // Check if Firebase is already initialized
        if (firebaseApp) {
            logger.info("Firebase already initialized");
            return;
        }

        // Initialize Firebase Admin SDK
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountKey) {
            logger.warn(
                "Firebase service account key not provided. Firebase features will be disabled."
            );
            return;
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountKey);
        } catch (parseError) {
            logger.error("Invalid Firebase service account key format:", parseError);
            return;
        }

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });

        logger.info("✅ Firebase initialized successfully");
    } catch (error) {
        logger.error("❌ Firebase initialization failed:", error);
        throw error;
    }
};

export const getFirebaseApp = (): admin.app.App | null => {
    return firebaseApp;
};

// Firestore database instance
export const getFirestore = (): admin.firestore.Firestore | null => {
    if (!firebaseApp) {
        logger.warn("Firebase not initialized. Firestore unavailable.");
        return null;
    }
    return firebaseApp.firestore();
};

// Firebase Auth instance
export const getAuth = (): admin.auth.Auth | null => {
    if (!firebaseApp) {
        logger.warn("Firebase not initialized. Auth unavailable.");
        return null;
    }
    return firebaseApp.auth();
};

// Firebase Storage instance
export const getStorage = (): admin.storage.Storage | null => {
    if (!firebaseApp) {
        logger.warn("Firebase not initialized. Storage unavailable.");
        return null;
    }
    return firebaseApp.storage();
};

// Firebase Messaging instance
export const getMessaging = (): admin.messaging.Messaging | null => {
    if (!firebaseApp) {
        logger.warn("Firebase not initialized. Messaging unavailable.");
        return null;
    }
    return firebaseApp.messaging();
};

// Push notification service
export const sendPushNotification = async (
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<boolean> => {
    try {
        const messaging = getMessaging();
        if (!messaging) {
            logger.warn("Firebase Messaging not available");
            return false;
        }

        const message: admin.messaging.Message = {
            token,
            notification: {
                title,
                body,
            },
            data: data || {},
            android: {
                notification: {
                    icon: "ic_notification",
                    color: "#1976D2",
                    sound: "default",
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        badge: 1,
                    },
                },
            },
        };

        const response = await messaging.send(message);
        logger.info(`Push notification sent successfully: ${response}`);
        return true;
    } catch (error) {
        logger.error("Failed to send push notification:", error);
        return false;
    }
};

// Send push notification to multiple devices
export const sendMulticastNotification = async (
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> => {
    try {
        const messaging = getMessaging();
        if (!messaging) {
            logger.warn("Firebase Messaging not available");
            return { successCount: 0, failureCount: tokens.length };
        }

        const message: admin.messaging.MulticastMessage = {
            tokens,
            notification: {
                title,
                body,
            },
            data: data || {},
            android: {
                notification: {
                    icon: "ic_notification",
                    color: "#1976D2",
                    sound: "default",
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        badge: 1,
                    },
                },
            },
        };

        const response = await messaging.sendMulticast(message);
        logger.info(
            `Multicast notification sent: ${response.successCount} success, ${response.failureCount} failures`
        );

        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
        };
    } catch (error) {
        logger.error("Failed to send multicast notification:", error);
        return { successCount: 0, failureCount: tokens.length };
    }
};

// Upload file to Firebase Storage
export const uploadToStorage = async (
    file: Buffer,
    fileName: string,
    contentType: string,
    folder: string = "uploads"
): Promise<string | null> => {
    try {
        const storage = getStorage();
        if (!storage) {
            logger.warn("Firebase Storage not available");
            return null;
        }

        const bucket = storage.bucket();
        const fileRef = bucket.file(`${folder}/${fileName}`);

        await fileRef.save(file, {
            metadata: {
                contentType,
            },
        });

        // Make file publicly accessible
        await fileRef.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${folder}/${fileName}`;
        logger.info(`File uploaded to Firebase Storage: ${publicUrl}`);

        return publicUrl;
    } catch (error) {
        logger.error("Failed to upload file to Firebase Storage:", error);
        return null;
    }
};

// Delete file from Firebase Storage
export const deleteFromStorage = async (
    fileName: string,
    folder: string = "uploads"
): Promise<boolean> => {
    try {
        const storage = getStorage();
        if (!storage) {
            logger.warn("Firebase Storage not available");
            return false;
        }

        const bucket = storage.bucket();
        const fileRef = bucket.file(`${folder}/${fileName}`);

        await fileRef.delete();
        logger.info(`File deleted from Firebase Storage: ${folder}/${fileName}`);

        return true;
    } catch (error) {
        logger.error("Failed to delete file from Firebase Storage:", error);
        return false;
    }
};

// Verify Firebase ID token
export const verifyIdToken = async (
    idToken: string
): Promise<admin.auth.DecodedIdToken | null> => {
    try {
        const auth = getAuth();
        if (!auth) {
            logger.warn("Firebase Auth not available");
            return null;
        }

        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        logger.error("Failed to verify Firebase ID token:", error);
        return null;
    }
};

// Create custom token
export const createCustomToken = async (
    uid: string,
    additionalClaims?: object
): Promise<string | null> => {
    try {
        const auth = getAuth();
        if (!auth) {
            logger.warn("Firebase Auth not available");
            return null;
        }

        const customToken = await auth.createCustomToken(uid, additionalClaims);
        return customToken;
    } catch (error) {
        logger.error("Failed to create custom token:", error);
        return null;
    }
};
