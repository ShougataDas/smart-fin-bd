import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, MessageType } from '@/types';

interface ChatState {
    messages: ChatMessage[];
    isTyping: boolean;
    isLoading: boolean;
    error: string | null;
    conversationId: string | null;
}

interface ChatActions {
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    sendMessage: (text: string) => Promise<void>;
    clearMessages: () => void;
    setTyping: (isTyping: boolean) => void;
    clearError: () => void;
    generateAIResponse: (userMessage: string) => Promise<string>;
}

type ChatStore = ChatState & ChatActions;

const initialState: ChatState = {
    messages: [],
    isTyping: false,
    isLoading: false,
    error: null,
    conversationId: null,
};

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            addMessage: (messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
                const newMessage: ChatMessage = {
                    ...messageData,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    timestamp: new Date(),
                };

                set(state => ({
                    messages: [...state.messages, newMessage],
                }));
            },

            sendMessage: async (text: string) => {
                const { addMessage, generateAIResponse, setTyping } = get();

                // Add user message
                addMessage({
                    userId: 'current_user', // This should come from auth store
                    text,
                    isUser: true,
                    type: MessageType.TEXT,
                });

                // Set typing indicator
                setTyping(true);
                set({ isLoading: true, error: null });

                try {
                    // Generate AI response
                    const aiResponse = await generateAIResponse(text);

                    // Add AI message
                    addMessage({
                        userId: 'ai_assistant',
                        text: aiResponse,
                        isUser: false,
                        type: MessageType.TEXT,
                    });

                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to get AI response',
                    });

                    // Add error message
                    addMessage({
                        userId: 'ai_assistant',
                        text: 'দুঃখিত, আমি এই মুহূর্তে আপনার প্রশ্নের উত্তর দিতে পারছি না। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
                        isUser: false,
                        type: MessageType.TEXT,
                    });
                } finally {
                    setTyping(false);
                    set({ isLoading: false });
                }
            },

            generateAIResponse: async (userMessage: string): Promise<string> => {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

                const lowerMessage = userMessage.toLowerCase();

                // Bengali financial advice responses
                if (lowerMessage.includes('সঞ্চয়পত্র') || lowerMessage.includes('sanchayapatra')) {
                    return `সঞ্চয়পত্র বাংলাদেশ সরকারের একটি অত্যন্ত নিরাপদ বিনিয়োগ মাধ্যম। বর্তমানে এতে ৮.৫% পর্যন্ত বার্ষিক সুদ পাওয়া যায়। 

✅ **সুবিধাসমূহ:**
• সরকারি গ্যারান্টি
• নিয়মিত সুদ প্রদান
• কর সুবিধা (সীমিত পরিমাণে)
• ন্যূনতম ১০০০ টাকা থেকে শুরু

📊 **আপনার জন্য উপযুক্ততা:** আপনার ঝুঁকি সহনশীলতা অনুযায়ী এটি একটি চমৎকার বিকল্প হতে পারে।`;
                }

                if (lowerMessage.includes('মিউচুয়াল ফান্ড') || lowerMessage.includes('mutual fund')) {
                    return `মিউচুয়াল ফান্ড হলো একটি যৌথ বিনিয়োগ মাধ্যম যেখানে অনেক বিনিয়োগকারীর অর্থ একসাথে করে পেশাদার ফান্ড ম্যানেজাররা বিভিন্ন কোম্পানির শেয়ারে বিনিয়োগ করেন।

💰 **প্রত্যাশিত রিটার্ন:** ১২-১৫% (বাজার অনুযায়ী)
🎯 **ন্যূনতম বিনিয়োগ:** ৫,০০০ টাকা

**সুবিধা:**
• পেশাদার ব্যবস্থাপনা
• ঝুঁকি বিভাজন
• তরলতা (সহজে বিক্রয়)
• স্বচ্ছতা

**ঝুঁকি:** মাঝারি থেকে উচ্চ (বাজারের উপর নির্ভরশীল)`;
                }

                if (lowerMessage.includes('স্টক') || lowerMessage.includes('stock') || lowerMessage.includes('শেয়ার')) {
                    return `স্টক মার্কেটে বিনিয়োগ উচ্চ রিটার্নের সম্ভাবনা রয়েছে, তবে ঝুঁকিও বেশি।

🚀 **সম্ভাব্য রিটার্ন:** ১৫-২৫% (দীর্ঘমেয়াদে)
⚠️ **ঝুঁকি:** উচ্চ

**শুরু করার টিপস:**
১. ভালো কোম্পানি নির্বাচন করুন
২. প্রথমে কম অর্থ দিয়ে শুরু করুন
৩. দীর্ঘমেয়াদী দৃষ্টিভঙ্গি রাখুন
৪. বাজার গবেষণা করুন
৫. বিভিন্ন সেক্টরে বিনিয়োগ করুন

**সুপারিশ:** আপনার পোর্টফোলিওর ২০-৩০% স্টকে রাখতে পারেন।`;
                }

                if (lowerMessage.includes('dps') || lowerMessage.includes('ডিপিএস')) {
                    return `DPS (Deposit Pension Scheme) একটি দীর্ঘমেয়াদী সঞ্চয় পরিকল্পনা।

💵 **বৈশিষ্ট্য:**
• মাসিক নির্দিষ্ট পরিমাণ জমা
• ৫-২০ বছরের মেয়াদ
• ৭-৮% বার্ষিক সুদ
• পেনশন সুবিধা

**সুবিধা:**
• নিয়মিত সঞ্চয়ের অভ্যাস
• নিরাপদ বিনিয়োগ
• পেনশন পরিকল্পনা
• ন্যূনতম ৫০০ টাকা/মাস

**উপযুক্ততা:** নিয়মিত আয়ের জন্য এবং অবসর পরিকল্পনার জন্য চমৎকার।`;
                }

                if (lowerMessage.includes('বয়স') || lowerMessage.includes('age') || lowerMessage.includes('কত টাকা')) {
                    return `বয়স অনুযায়ী সঞ্চয়ের একটি সাধারণ নিয়ম:

📈 **বয়স ভিত্তিক সঞ্চয় গাইড:**
• ২০-৩০ বছর: মাসিক আয়ের ২০-৩০%
• ৩০-৪০ বছর: মাসিক আয়ের ৩০-৪০%
• ৪০-৫০ বছর: মাসিক আয়ের ৪০-৫০%
• ৫০+ বছর: মাসিক আয়ের ৫০%+

**জরুরি তহবিল:** ৬-১২ মাসের খরচের সমান

**বিনিয়োগ বিভাজন (বয়স অনুযায়ী):**
• তরুণ বয়স: ৭০% ঝুঁকিপূর্ণ, ৩০% নিরাপদ
• মধ্য বয়স: ৫০% ঝুঁকিপূর্ণ, ৫০% নিরাপদ
• বয়স্ক: ৩০% ঝুঁকিপূর্ণ, ৭০% নিরাপদ`;
                }

                if (lowerMessage.includes('লক্ষ্য') || lowerMessage.includes('goal') || lowerMessage.includes('পরিকল্পনা')) {
                    return `আর্থিক লক্ষ্য নির্ধারণ খুবই গুরুত্বপূর্ণ। এখানে একটি কার্যকর পদ্ধতি:

🎯 **SMART লক্ষ্য নির্ধারণ:**
• **S**pecific (সুনির্দিষ্ট)
• **M**easurable (পরিমাপযোগ্য)
• **A**chievable (অর্জনযোগ্য)
• **R**elevant (প্রাসঙ্গিক)
• **T**ime-bound (সময়সীমা)

**সাধারণ লক্ষ্যসমূহ:**
১. জরুরি তহবিল (৬ মাসের খরচ)
২. বাড়ি কেনা
৩. সন্তানের শিক্ষা
৪. অবসর পরিকল্পনা
৫. ব্যবসা শুরু

**পরামর্শ:** প্রতিটি লক্ষ্যের জন্য আলাদা বিনিয়োগ পরিকল্পনা করুন।`;
                }

                // Default response for general queries
                return `আপনার প্রশ্নটি খুবই গুরুত্বপূর্ণ। আমি আপনাকে সাহায্য করতে চাই।

🤝 **আমি যেভাবে সাহায্য করতে পারি:**
• বিনিয়োগ পরামর্শ
• ঝুঁকি মূল্যায়ন
• আর্থিক পরিকল্পনা
• সঞ্চয় কৌশল
• বাজার বিশ্লেষণ

আপনার বয়স, আয়, এবং ঝুঁকি নেওয়ার ক্ষমতার উপর ভিত্তি করে আমি আরও নির্দিষ্ট পরামর্শ দিতে পারব। 

💡 **পরামর্শ:** আপনার প্রোফাইল সম্পূর্ণ করুন যাতে আমি আরও ব্যক্তিগতকৃত পরামর্শ দিতে পারি।

আরও কোনো নির্দিষ্ট প্রশ্ন থাকলে জিজ্ঞাসা করুন!`;
            },

            clearMessages: () => {
                set({ messages: [] });
            },

            setTyping: (isTyping: boolean) => {
                set({ isTyping });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'chat-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                messages: state.messages.slice(-50), // Keep only last 50 messages
                conversationId: state.conversationId,
            }),
        }
    )
);

