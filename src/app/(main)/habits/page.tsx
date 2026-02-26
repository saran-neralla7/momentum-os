'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Flame, Activity, X, PenLine, Heart } from 'lucide-react';
import { hapticFeedback } from '@/lib/utils';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';

export default function HabitsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [contextModalOpen, setContextModalOpen] = useState<{ isOpen: boolean, habitId: string | number | null }>({ isOpen: false, habitId: null });
    const [showAddModal, setShowAddModal] = useState(false);
    const [newHabitTitle, setNewHabitTitle] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const calendarDates = Array.from({ length: 15 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (14 - i));
        return d;
    });

    useEffect(() => {
        const scroller = document.getElementById('calendar-scroller');
        if (scroller) {
            scroller.scrollLeft = scroller.scrollWidth;
        }
    }, []);

    useEffect(() => {
        const fetchHabits = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('habits').select('*').eq('user_id', user.id);
                if (data) {
                    // Fetch completed logs for last 30 days to calculate stats and streaks
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

                    const { data: allLogs } = await supabase.from('habit_logs')
                        .select('habit_id, date, completed')
                        .gte('date', thirtyDaysAgoStr)
                        .eq('completed', true)
                        .order('date', { ascending: false });

                    setItems(data.map(d => {
                        const habitLogs = allLogs?.filter(l => l.habit_id === d.id) || [];
                        const completedCount = habitLogs.length;

                        // Calculate current streak
                        let currentStreak = 0;
                        const completedDates = new Set(habitLogs.map(l => l.date));

                        const checkDate = new Date();
                        const todayStr = checkDate.toISOString().split('T')[0];
                        checkDate.setDate(checkDate.getDate() - 1);
                        const yesterdayStr = checkDate.toISOString().split('T')[0];

                        // Determine if streak is alive
                        let streakCheckDate: Date | null = new Date();
                        if (!completedDates.has(todayStr) && completedDates.has(yesterdayStr)) {
                            // Streak alive from yesterday
                            streakCheckDate = new Date();
                            streakCheckDate.setDate(streakCheckDate.getDate() - 1);
                        } else if (!completedDates.has(todayStr)) {
                            // Broken streak
                            streakCheckDate = null;
                        }

                        if (streakCheckDate) {
                            for (let i = 0; i < 30; i++) {
                                const dStr = streakCheckDate.toISOString().split('T')[0];
                                if (completedDates.has(dStr)) {
                                    currentStreak++;
                                    streakCheckDate.setDate(streakCheckDate.getDate() - 1);
                                } else {
                                    break;
                                }
                            }
                        }

                        return {
                            id: d.id,
                            title: d.title,
                            streak: currentStreak,
                            completed: completedDates.has(selectedDate),
                            category: d.category || 'General',
                            stats: { completed: completedCount, days: 30 }
                        };
                    }));
                }
            }
        };
        fetchHabits();
    }, [selectedDate]);

    const handleAddHabit = async () => {
        hapticFeedback.light();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && newHabitTitle.trim() !== '') {
            const { data, error } = await supabase.from('habits').insert([
                { user_id: user.id, title: newHabitTitle, frequency: 'daily', category: 'Health' }
            ]).select();

            if (data && data.length > 0) {
                setItems([...items, {
                    id: data[0].id,
                    title: data[0].title,
                    streak: 0,
                    completed: false,
                    category: data[0].category,
                    stats: { completed: 0, days: 30 }
                }]);
                setNewHabitTitle('');
                setShowAddModal(false);
            }
        }
    };

    const toggleHabit = async (id: string | number) => {
        const habit = items.find(h => h.id === id);
        // Prevent unmarking: if already completed today, do not allow changes
        if (!habit || habit.completed) return;

        hapticFeedback.light();

        // Optimistic UI Update
        setItems(items.map(h => h.id === id ? { ...h, completed: true } : h));

        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#FF9933', '#FFFFFF', '#138808', '#FFD700']
        });

        // Insert log in background
        await supabase.from('habit_logs').upsert(
            { habit_id: id, date: selectedDate, completed: true },
            { onConflict: 'habit_id,date' }
        );
    };

    return (
        <div className="pb-24">
            <div className="p-6 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-lg mx-auto bg-background min-h-screen">
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Habits</h1>
                        <p className="text-muted-foreground mt-1">Consistency is key.</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddModal(true)}
                        className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md cursor-pointer"
                    >
                        <Plus className="h-5 w-5" />
                    </motion.button>
                </header>

                {/* Horizontal Calendar Scroller */}
                <div id="calendar-scroller" className="flex overflow-x-auto gap-3 pb-4 -mx-6 px-6 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {calendarDates.map((date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = dateStr === selectedDate;
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = date.getDate();

                        return (
                            <button
                                key={dateStr}
                                onClick={() => {
                                    hapticFeedback.light();
                                    setSelectedDate(dateStr);
                                }}
                                className={`flex flex-col items-center justify-center shrink-0 w-16 h-24 rounded-3xl border transition-all snap-center ${isSelected ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105' : 'bg-card text-muted-foreground border-border/50 hover:border-primary/50'}`}
                            >
                                <span className="text-xs font-medium mb-1 opacity-80">{dayName}</span>
                                <span className="text-xl font-bold">{dayNum}</span>
                                <span className={`w-1.5 h-1.5 rounded-full mt-2 ${isToday ? (isSelected ? 'bg-primary-foreground' : 'bg-primary') : 'bg-transparent'}`} />
                            </button>
                        );
                    })}
                </div>

                {/* Habits List with Dependency Chain */}
                <div className="space-y-3 relative mt-2">
                    <h3 className="text-lg font-medium mb-4">
                        {selectedDate === new Date().toISOString().split('T')[0]
                            ? "Today's Habits"
                            : new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h3>

                    {/* Visual Dependency Chain Line */}
                    <div className="absolute left-8 top-16 bottom-10 w-px bg-border/50 z-0 hidden sm:block md:block" />

                    <AnimatePresence>
                        {items.map((habit, index) => (
                            <div key={habit.id} className="relative z-10 w-full overflow-hidden rounded-2xl border border-border/50 bg-destructive shadow-sm">
                                {/* Hidden Delete Background */}
                                <div className="absolute inset-y-0 right-0 flex items-center pr-6 z-0">
                                    <span className="text-destructive-foreground font-semibold">Delete</span>
                                </div>

                                <motion.div
                                    layout
                                    drag="x"
                                    dragConstraints={{ left: -100, right: 0 }}
                                    dragElastic={0.1}
                                    onDragEnd={async (e, info) => {
                                        if (info.offset.x < -80) {
                                            const { error } = await supabase.from('habits').delete().eq('id', habit.id);
                                            if (!error) {
                                                setItems(items.filter(h => h.id !== habit.id));
                                                hapticFeedback.heavy();
                                            }
                                        }
                                    }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative z-10 p-4 border flex items-center justify-between transition-colors m-0 rounded-2xl ${habit.completed
                                        ? 'bg-primary/10 border-primary/20 backdrop-blur-md'
                                        : 'bg-card border-border/50 shadow-sm backdrop-blur-md'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 w-full">
                                        <button onClick={() => toggleHabit(habit.id)} className="focus:outline-none shrink-0 cursor-pointer">
                                            {habit.completed ? (
                                                <CheckCircle2 className="h-6 w-6 text-primary" />
                                            ) : (
                                                <Circle className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </button>
                                        <div className="flex-1">
                                            <h4 className={`font-medium ${habit.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                {habit.title}
                                            </h4>
                                            <div className="flex items-center flex-wrap gap-2 mt-1">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                    {habit.category}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Activity className="h-3 w-3 text-blue-500" />
                                                    {Math.round((habit.stats.completed / habit.stats.days) * 100)}% {habit.stats.days === 30 ? 'this month' : 'this week'}
                                                </span>
                                                <Link href="/habits/focus" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors ml-1">
                                                    <Flame className="h-3 w-3 text-orange-500" /> {habit.streak}
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Journaling Prompt if Not Completed */}
                                        {!habit.completed && (
                                            <button
                                                onClick={() => setContextModalOpen({ isOpen: true, habitId: habit.id })}
                                                className="shrink-0 p-2 text-muted-foreground hover:text-primary transition-colors bg-secondary/50 rounded-full"
                                            >
                                                <PenLine className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Micro-Journaling Modal */}
                <AnimatePresence>
                    {contextModalOpen.isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 pb-safe"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="w-full max-w-sm bg-card border border-border/50 shadow-2xl rounded-3xl p-6 relative"
                            >
                                <button onClick={() => setContextModalOpen({ isOpen: false, habitId: null })} className="absolute top-4 right-4 p-2 bg-secondary/50 rounded-full hover:bg-secondary">
                                    <X className="h-4 w-4" />
                                </button>
                                <h2 className="text-xl font-bold tracking-tight mb-2">Reflect</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    What's creating friction for this habit today? Note it down to improve your system.
                                </p>
                                <textarea
                                    className="w-full h-32 p-3 bg-secondary/30 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm placeholder:text-muted-foreground resize-none"
                                    placeholder="E.g., Too tired after work, need to shift to mornings..."
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        hapticFeedback.light();
                                        setContextModalOpen({ isOpen: false, habitId: null });
                                    }}
                                    className="w-full mt-4 h-12 bg-primary text-primary-foreground rounded-xl font-medium shadow-md transition-transform active:scale-95"
                                >
                                    Log Context
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Add Habit Modal */}
                <AnimatePresence>
                    {showAddModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 pb-safe"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="w-full max-w-sm bg-card border border-border/50 shadow-2xl rounded-3xl p-6 relative"
                            >
                                <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 bg-secondary/50 rounded-full hover:bg-secondary">
                                    <X className="h-4 w-4" />
                                </button>
                                <h2 className="text-xl font-bold tracking-tight mb-4">New Habit</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground ml-1">Habit Name</label>
                                        <input
                                            type="text"
                                            value={newHabitTitle}
                                            onChange={(e) => setNewHabitTitle(e.target.value)}
                                            className="w-full mt-1 h-12 px-4 bg-secondary/30 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                                            placeholder="E.g., Read 10 Pages..."
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddHabit}
                                        disabled={!newHabitTitle}
                                        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium shadow-md transition-transform active:scale-95 disabled:opacity-50"
                                    >
                                        Create Habit
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
