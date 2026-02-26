'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Flame, Activity, X, PenLine, ShieldAlert } from 'lucide-react';
import { hapticFeedback } from '@/lib/utils';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';
import { useMomentum } from '@/contexts/MomentumContext';
import MilestoneTrophy from '@/components/ui/MilestoneTrophy';

export default function HabitsPage() {
    const { freezes } = useMomentum();
    const [items, setItems] = useState<any[]>([]);
    const [contextModalOpen, setContextModalOpen] = useState<{ isOpen: boolean, habitId: string | number | null }>({ isOpen: false, habitId: null });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showMilestone, setShowMilestone] = useState<number | null>(null);
    const [newHabitTitle, setNewHabitTitle] = useState('');
    const [newHabitDays, setNewHabitDays] = useState<string[]>(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
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
                    // Fetch Freezes
                    const { data: profile } = await supabase.from('profiles').select('freezes_available').eq('id', user.id).single();
                    let freezesAvailable = profile?.freezes_available || 0;

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

                        // Parse frequency logic (Daily vs Specific Days)
                        let reqDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                        if (typeof d.frequency === 'object' && Array.isArray(d.frequency)) {
                            reqDays = d.frequency;
                        }

                        // Calculate current streak
                        let currentStreak = 0;
                        const completedDates = new Set(habitLogs.map(l => l.date));
                        let localFreezes = freezesAvailable;

                        const checkDate = new Date();
                        const todayStr = checkDate.toISOString().split('T')[0];

                        let streakCheckDate: Date | null = new Date();

                        // Check if streak is alive looking backwards
                        for (let i = 0; i < 30; i++) {
                            const dStr = streakCheckDate.toISOString().split('T')[0];
                            const dName = streakCheckDate.toLocaleDateString('en-US', { weekday: 'short' });

                            // If today is a required day but not completed, just skip checking today (can complete it later)
                            if (dStr === todayStr && !completedDates.has(dStr)) {
                                streakCheckDate.setDate(streakCheckDate.getDate() - 1);
                                continue;
                            }

                            // If it's a required day
                            if (reqDays.includes(dName) || d.frequency === 'daily') {
                                if (completedDates.has(dStr)) {
                                    currentStreak++;
                                } else {
                                    // Missed a required day. Can they freeze?
                                    if (localFreezes > 0) {
                                        localFreezes--;
                                        currentStreak++;
                                    } else {
                                        // Streak broken
                                        break;
                                    }
                                }
                            }
                            streakCheckDate.setDate(streakCheckDate.getDate() - 1);
                        }

                        return {
                            id: d.id,
                            title: d.title,
                            streak: currentStreak,
                            completed: completedDates.has(selectedDate),
                            category: d.category || 'General',
                            frequency: d.frequency,
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
                { user_id: user.id, title: newHabitTitle, frequency: newHabitDays, category: 'Health' }
            ]).select();

            if (data && data.length > 0) {
                setItems([...items, {
                    id: data[0].id,
                    title: data[0].title,
                    streak: 0,
                    completed: false,
                    category: data[0].category,
                    frequency: data[0].frequency,
                    stats: { completed: 0, days: 30 }
                }]);
                setNewHabitTitle('');
                setNewHabitDays(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
                setShowAddModal(false);
            }
        }
    };

    const toggleHabit = async (id: string | number) => {
        const habit = items.find(h => h.id === id);
        // Prevent unmarking: if already completed today, do not allow changes
        if (!habit || habit.completed) return;

        hapticFeedback.light();

        const newStreak = habit.streak + 1;
        // Check for Milestones (10, 21, 50, 100)
        if (newStreak === 10 || newStreak === 21 || newStreak === 50 || newStreak === 100) {
            setShowMilestone(newStreak);
        }

        // 1. Save previous state for rollback
        const previousItems = [...items];

        // 2. Optimistic UI Update (Instant visual feedback)
        setItems(items.map(h => h.id === id ? { ...h, completed: true, streak: newStreak } : h));

        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#FF9933', '#FFFFFF', '#138808', '#FFD700']
        });

        // 3. Network Request
        try {
            const { error } = await supabase.from('habit_logs').upsert(
                { habit_id: id, date: selectedDate, completed: true },
                { onConflict: 'habit_id,date' }
            );

            if (error) throw error;
        } catch (error) {
            console.error("Failed to log habit:", error);
            // 4. Rollback on Failure
            setItems(previousItems);
            hapticFeedback.heavy();
        }
    };

    return (
        <div className="pb-24">
            <div className="p-6 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-lg mx-auto bg-background min-h-screen">
                <header className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-semibold tracking-tight">Habits</h1>
                            {freezes > 0 && (
                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                    <ShieldAlert className="w-3 h-3" /> {freezes} Freezes
                                </span>
                            )}
                        </div>
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
                        {items.filter(habit => {
                            const dName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short' });
                            if (habit.frequency === 'daily') return true;
                            if (Array.isArray(habit.frequency) && habit.frequency.includes(dName)) return true;
                            return false;
                        }).map((habit, index) => (
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
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground ml-1 mb-2 block">Habit Days</label>
                                        <div className="flex justify-between gap-1">
                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                                <button
                                                    key={day}
                                                    onClick={() => {
                                                        hapticFeedback.light();
                                                        if (newHabitDays.includes(day)) {
                                                            if (newHabitDays.length > 1) { // Prevent empty arrays
                                                                setNewHabitDays(newHabitDays.filter(d => d !== day));
                                                            }
                                                        } else {
                                                            setNewHabitDays([...newHabitDays, day]);
                                                        }
                                                    }}
                                                    className={`flex-1 h-10 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors border ${newHabitDays.includes(day) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/30 text-muted-foreground border-border/50 hover:bg-secondary/80'}`}
                                                >
                                                    {day[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddHabit}
                                        disabled={!newHabitTitle || newHabitDays.length === 0}
                                        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-2"
                                    >
                                        Create Habit
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Milestone 3D Trophy Modal */}
                <AnimatePresence>
                    {showMilestone !== null && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
                        >
                            <button onClick={() => setShowMilestone(null)} className="absolute top-6 right-6 p-3 bg-secondary/50 rounded-full hover:bg-secondary z-50">
                                <X className="h-6 w-6 text-foreground" />
                            </button>

                            <motion.div
                                initial={{ scale: 0.8, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                                transition={{ type: 'spring', bounce: 0.5 }}
                                className="w-full max-w-sm relative"
                            >
                                <MilestoneTrophy streak={showMilestone} />

                                <button
                                    onClick={() => {
                                        hapticFeedback.light();
                                        setShowMilestone(null);
                                    }}
                                    className="w-full mt-6 h-14 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl transition-transform active:scale-95 text-lg"
                                >
                                    Claim Trophy
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
