'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'te' | 'ta';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        dashboard: 'Dashboard',
        habits: 'Habits',
        expenses: 'Expenses',
        profile: 'Profile',
        consistency: 'Consistency is key.',
        today_habits: "Today's Habits",
        heatmap: 'Activity Heatmap',
        spent: 'Spent',
        budget_limit: 'Budget Limit',
        this_month: 'This Month',
        spending_velocity: 'Spending Velocity',
        recent_transactions: 'Recent Transactions',
        smart_expense: 'Smart Expense Entry',
        clear_mind: 'Clear Your Mind',
        monk_mode: 'Monk Mode',
        ai_assessment: 'AI Assessment (Paisa-Vasool Mode)',
        roast_1: 'Bro what are you doing? ₹1,240 on Food this month? Are you Ambani? Stop using Zomato and cook at home.',
        roast_2: 'Kanjoos alert! You saved well this week, but your coding streak is dying. Get back to work.'
    },
    hi: {
        dashboard: 'डैशबोर्ड',
        habits: 'आदतें',
        expenses: 'खर्च',
        profile: 'प्रोफ़ाइल',
        consistency: 'निरंतरता ही कुंजी है।',
        today_habits: 'आज की आदतें',
        heatmap: 'गतिविधि हीटमैप',
        spent: 'खर्च किया',
        budget_limit: 'बजट सीमा',
        this_month: 'इस महीने',
        spending_velocity: 'खर्च की गति',
        recent_transactions: 'हाल के लेन-देन',
        smart_expense: 'स्मार्ट खर्च प्रविष्टि',
        clear_mind: 'दिमाग शांत करें',
        monk_mode: 'ध्यान मुद्रा',
        ai_assessment: 'एआई मूल्यांकन (पैसा-वसूल मोड)',
        roast_1: 'भाई क्या कर रहा है? इस महीने खाने पर ₹1,240? खुद को अंबानी समझता है क्या? Zomato बंद कर और घर का खाना खा।',
        roast_2: 'कंजूस अलर्ट! इस हफ्ते बचत अच्छी की, लेकिन तुम्हारी कोडिंग स्ट्रीक मर रही है। वापस काम पर लग जा।'
    },
    te: {
        dashboard: 'డాష్‌బోర్డ్',
        habits: 'అలవాట్లు',
        expenses: 'ఖర్చులు',
        profile: 'ప్రొఫైల్',
        consistency: 'స్థిరత్వం ముఖ్యం.',
        today_habits: 'నేటి అలవాట్లు',
        heatmap: 'యాక్టివిటీ హీట్‌మ్యాప్',
        spent: 'ఖర్చు',
        budget_limit: 'బడ్జెట్ పరిమితి',
        this_month: 'ఈ నెల',
        spending_velocity: 'ఖర్చు వేగం',
        recent_transactions: 'ఇటీవలి లావాదేవీలు',
        smart_expense: 'స్మార్ట్ ఖర్చు నమోదు',
        clear_mind: 'మనస్సును ప్రశాంతంగా ఉంచండి',
        monk_mode: 'ఏకాగ్రత మోడ్',
        ai_assessment: 'విశ్లేషణ (పైసా-వసూల్ మోడ్)',
        roast_1: 'బ్రో ఏందిది? ఈ నెల ఫుడ్ కి ₹1,240 ఆ? అంబానీ అనుకుంటున్నావా? Zomato ఆపి ఇంట్లో వండుకో.',
        roast_2: 'కన్జూస్ అలర్ట్! ఈ వారం బాగానే దాచావ్, కానీ నీ కోడింగ్ స్ట్రీక్ చచ్చిపోతుంది. వెళ్ళి పని చూసుకో.'
    },
    ta: {
        dashboard: 'முகப்பு',
        habits: 'பழக்கங்கள்',
        expenses: 'செலவுகள்',
        profile: 'சுயவிவரம்',
        consistency: 'தொடர்ச்சி முக்கியம்.',
        today_habits: 'இன்றைய பழக்கங்கள்',
        heatmap: 'செயல்பாடு வரைபடம்',
        spent: 'செலவு',
        budget_limit: 'பட்ஜெட் வரம்பு',
        this_month: 'இந்த மாதம்',
        spending_velocity: 'செலவு வேகம்',
        recent_transactions: 'சமீபத்திய பரிவர்த்தனைகள்',
        smart_expense: 'ஸ்மார்ட் செலவு நுழைவு',
        clear_mind: 'மனதை தளர்த்தவும்',
        monk_mode: 'தியான நிலை',
        ai_assessment: 'AI மதிப்பீடு (பைசா-வசூல் மோட்)',
        roast_1: 'ப்ரோ என்ன பண்ற? இந்த மாசம் சாப்பாட்டுக்கு ₹1,240 செலவா? அம்பானியா நீ? Zomato நிறுத்திட்டு வீட்ல சமைச்சு சாப்புடு.',
        roast_2: 'கஞ்சப்பயலே! இந்த வாரம் நல்லா சேமிச்ச, ஆனா உன் கோடிங் ஸ்ட்ரீக் செத்துக்கிட்டு இருக்கு. போய் வேலைய பாரு.'
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        // Hydrate from localStorage if available
        const savedLang = localStorage.getItem('momentum_lang') as Language;
        if (savedLang && translations[savedLang]) {
            setLanguage(savedLang);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('momentum_lang', lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
