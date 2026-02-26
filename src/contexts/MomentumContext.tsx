'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateMomentumScore } from '@/lib/utils';

interface MomentumContextType {
    score: number;
    auraColor: string;
    freezes: number;
    refreshScore: () => Promise<void>;
}

const MomentumContext = createContext<MomentumContextType>({
    score: 250,
    auraColor: 'bg-primary/5',
    freezes: 0,
    refreshScore: async () => { },
});

export const useMomentum = () => useContext(MomentumContext);

export function MomentumProvider({ children }: { children: React.ReactNode }) {
    const [score, setScore] = useState(250);
    const [auraColor, setAuraColor] = useState('bg-primary/5');
    const [freezes, setFreezes] = useState(0);

    const refreshScore = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Data matching the Dashboard logic for a unified global score
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Fetch Expenses
        const { data: expenses } = await supabase.from('expenses').select('amount, date').eq('user_id', user.id);
        let totalExp = 0;
        if (expenses) {
            const thisMonthExpenses = expenses.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            totalExp = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        }

        // 2. Fetch Budget
        let currentBudget = 3000;
        const { data: budgetData } = await supabase.from('budgets').select('limit_amount').eq('user_id', user.id).eq('category', 'Monthly').single();
        if (budgetData) {
            currentBudget = budgetData.limit_amount;
        }

        // 3. Fetch Habits & Logs
        const { data: habits } = await supabase.from('habits').select('id').eq('user_id', user.id);
        if (habits) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: recentLogs } = await supabase.from('habit_logs')
                .select('habit_id, date')
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
                .eq('completed', true);

            const todayStr = new Date().toISOString().split('T')[0];

            const realHabits = habits.map(h => {
                const logs = recentLogs?.filter(l => l.habit_id === h.id) || [];
                const completedToday = logs.some(l => l.date === todayStr);
                return { streak: logs.length, completed: completedToday };
            });

            const newScore = calculateMomentumScore(realHabits, totalExp, currentBudget);
            setScore(newScore);

            // Calculate Aura Intensity
            if (newScore < 300) {
                setAuraColor('bg-red-500/10'); // Danger/Low
            } else if (newScore < 500) {
                setAuraColor('bg-amber-500/10'); // Neutral/Building
            } else if (newScore < 800) {
                setAuraColor('bg-emerald-500/15'); // Good/Solid Momentum
            } else {
                setAuraColor('bg-indigo-500/20'); // God Mode / Ultra Violet
            }
        }
        // 4. Fetch Freezes
        const { data: profileData } = await supabase.from('profiles').select('freezes_available').eq('id', user.id).single();
        if (profileData) {
            setFreezes(profileData.freezes_available);
        }
    };

    useEffect(() => {
        refreshScore();
    }, []);

    return (
        <MomentumContext.Provider value={{ score, auraColor, freezes, refreshScore }}>
            {children}
        </MomentumContext.Provider>
    );
}
