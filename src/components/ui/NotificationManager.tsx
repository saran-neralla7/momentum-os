'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { MessageSquareWarning, X } from 'lucide-react';
import { hapticFeedback } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';

export default function NotificationManager() {
    const [notification, setNotification] = useState<{ title: string; message: string; visible: boolean } | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        // Only run on the client side
        if (typeof window === 'undefined') return;

        let hasFiredThisSession = false;

        const checkDataForNotifications = async () => {
            if (hasFiredThisSession) return; // Only annoy once per session for now

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Scenario 1: Overdue Task
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('completed', false);

            if (tasks && tasks.length > 0) {
                const now = new Date().getTime();
                const overdue = tasks.filter(t => new Date(t.due_time).getTime() < now);

                if (overdue.length > 0) {
                    setNotification({
                        title: "Wake up!",
                        message: `You have ${overdue.length} overdue task(s). The clock is ticking, get it done.`,
                        visible: true
                    });
                    hasFiredThisSession = true;
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                    return;
                }
            }

            // Scenario 2: High Spending Velocity (Over 80% of Budget)
            const { data: expenses } = await supabase.from('expenses').select('amount').eq('user_id', user.id);
            const { data: budget } = await supabase.from('budgets').select('limit_amount').eq('user_id', user.id).eq('category', 'Monthly').single();

            if (expenses && budget) {
                const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
                if (totalSpent > (budget.limit_amount * 0.8)) {
                    setNotification({
                        title: "Account Empty Soon",
                        message: `Bro, you have spent ₹${totalSpent.toLocaleString()} already. Stop tapping your card everywhere.`,
                        visible: true
                    });
                    hasFiredThisSession = true;
                    if (navigator.vibrate) navigator.vibrate(500);
                    return;
                }
            }
        };

        // Check 5 seconds after app load
        const timeout = setTimeout(checkDataForNotifications, 5000);

        return () => clearTimeout(timeout);
    }, []);

    // Auto-hide notification after 6 seconds
    useEffect(() => {
        if (notification?.visible) {
            const timer = setTimeout(() => {
                setNotification(prev => prev ? { ...prev, visible: false } : null);
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [notification?.visible]);

    return (
        <AnimatePresence>
            {notification && notification.visible && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed top-safe pt-4 left-4 right-4 z-[200] flex justify-center pointer-events-none"
                >
                    <div className="bg-background/90 backdrop-blur-xl border border-destructive/30 shadow-2xl rounded-2xl p-4 max-w-sm w-full pointer-events-auto flex items-start gap-4 shadow-destructive/10 relative overflow-hidden">

                        <div className="absolute top-0 left-0 w-1 h-full bg-destructive animate-pulse" />

                        <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive shrink-0">
                            <MessageSquareWarning className="h-5 w-5" />
                        </div>

                        <div className="flex-1 pr-6">
                            <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                                {notification.message}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                hapticFeedback.light();
                                setNotification({ ...notification, visible: false });
                            }}
                            className="absolute top-3 right-3 p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
