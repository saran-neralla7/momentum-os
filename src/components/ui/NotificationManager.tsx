'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Flame, AlertCircle, IndianRupee, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { hapticFeedback } from '@/lib/utils';
import { usePathname } from 'next/navigation';

type NotificationType = 'task_overdue' | 'expense_high' | 'habit_missed' | 'general';

interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
}

export default function NotificationManager() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [lastCheck, setLastCheck] = useState<number>(Date.now());
    const pathname = usePathname();

    // The AI Persona's sarcastic templates
    const roastTemplates = {
        task_overdue: [
            "Bro, '{item}' was due. Stop scrolling reels and get it done.",
            "You missed the deadline for '{item}'. Typical.",
            "Are you ever going to finish '{item}'? The clock is ticking.",
        ],
        expense_high: [
            "₹{amount} on '{item}'? Ambani called, he wants his lifestyle back.",
            "You just dropped ₹{amount} on '{item}'. Your wallet is crying.",
            "Bro, ₹{amount} for '{item}'? Hope it was worth going broke for.",
        ],
        habit_missed: [
            "You broke your streak for '{item}'. Disappointing but expected.",
            "'{item}' missed. Guess consistency isn't your strong suit?",
        ]
    };

    const getRandomRoast = (type: NotificationType, item: string, amount?: string) => {
        const templates = roastTemplates[type as keyof typeof roastTemplates] || ["Wake up, you have things to do."];
        const template = templates[Math.floor(Math.random() * templates.length)];
        return template.replace('{item}', item).replace('{amount}', amount || '');
    };

    const addNotification = (notif: Omit<AppNotification, 'id'>) => {
        const newNotif = { ...notif, id: Math.random().toString(36).substring(7) };
        setNotifications(prev => {
            // Prevent duplicate spam
            if (prev.some(n => n.message === newNotif.message)) return prev;
            return [...prev, newNotif];
        });
        setIsVisible(true);
        hapticFeedback.heavy(); // Swiggy style heavy buzz when a notif drops
    };

    const dismiss = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notifications.length <= 1) setIsVisible(false);
    };

    // Polling logic to check for overdue items
    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const now = new Date();

            // 1. Check Tasks
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('completed', false);

            if (tasks) {
                tasks.forEach(task => {
                    const due = new Date(task.due_time);
                    // If overdue and haven't notified in the last 5 mins (or ever if just loaded)
                    if (now.getTime() > due.getTime() && (now.getTime() - due.getTime()) < 5 * 60000) {
                        addNotification({
                            title: "Time's Up!",
                            message: getRandomRoast('task_overdue', task.title),
                            type: 'task_overdue',
                            actionUrl: '/tasks'
                        });
                    }
                });
            }

            // 2. Check Expenses (e.g. any single expense > 1000 today)
            const today = now.toISOString().split('T')[0];
            const { data: expenses } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', today);

            if (expenses) {
                expenses.forEach(exp => {
                    if (Number(exp.amount) >= 1000) {
                        // Check if we already created a notification closely to the creation time (rough heuristic)
                        const expTime = new Date(exp.created_at).getTime();
                        if (now.getTime() - expTime < 2 * 60000) { // Just added within 2 mins
                            addNotification({
                                title: "Paisa Vasool Alert",
                                message: getRandomRoast('expense_high', exp.description || exp.category, exp.amount),
                                type: 'expense_high',
                                actionUrl: '/expenses'
                            });
                        }
                    }
                });
            }

            setLastCheck(now.getTime());
        };

        const interval = setInterval(checkStatus, 60000); // Check every minute
        // Initial check slight delay to let app load
        const timeout = setTimeout(checkStatus, 3000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    // Also clear notifications when route changes
    useEffect(() => {
        if (notifications.length > 0) {
            // Optional: clear on navigation if desired
            setIsVisible(false);
            setTimeout(() => setNotifications([]), 300);
        }
    }, [pathname]);


    if (notifications.length === 0 || !isVisible) return null;

    const currentNotification = notifications[notifications.length - 1]; // Show most recent

    const getIcon = () => {
        switch (currentNotification.type) {
            case 'expense_high': return <IndianRupee className="h-6 w-6 text-destructive" />;
            case 'task_overdue': return <AlertCircle className="h-6 w-6 text-orange-500" />;
            case 'habit_missed': return <Flame className="h-6 w-6 text-rose-500" />;
            default: return <Bell className="h-6 w-6 text-primary" />;
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0, scale: 0.9 }}
                    animate={{ y: 16, opacity: 1, scale: 1 }}
                    exit={{ y: -100, opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
                    className="fixed top-0 left-4 right-4 z-[100] max-w-sm mx-auto"
                >
                    <div className="bg-card/95 backdrop-blur-xl border border-border gap-4 shadow-2xl rounded-3xl p-4 flex items-start">
                        <div className="p-3 bg-secondary/50 rounded-2xl shrink-0">
                            {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                            <h4 className="font-semibold text-sm tracking-tight">{currentNotification.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-snug break-words">
                                {currentNotification.message}
                            </p>
                        </div>
                        <button
                            onClick={() => dismiss(currentNotification.id)}
                            className="p-2 shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-colors cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
