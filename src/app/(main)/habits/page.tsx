'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Flame, Activity, X, PenLine, Heart } from 'lucide-react';
import { hapticFeedback } from '@/lib/utils';
import Link from 'next/link';
import confetti from 'canvas-confetti';

const habits = [
    { id: 1, title: 'Morning Workout', streak: 12, completed: true, category: 'Health', stats: { completed: 9, days: 30 } },
    { id: 2, title: 'Drink Water', streak: 5, completed: false, category: 'Health', stats: { completed: 3, days: 7 } },
    { id: 3, title: 'Read 20 pages', streak: 8, completed: false, category: 'Study', stats: { completed: 8, days: 30 } },
    { id: 4, title: 'Code for 2 hours', streak: 28, completed: true, category: 'Coding', stats: { completed: 28, days: 30 } },
];

export default function HabitsPage() {
    const [items, setItems] = useState(habits);
    const [contextModalOpen, setContextModalOpen] = useState<{ isOpen: boolean, habitId: number | null }>({ isOpen: false, habitId: null });

    const toggleHabit = (id: number) => {
        hapticFeedback.light();
        setItems(items.map(h => {
            if (h.id === id) {
                if (!h.completed) {
                    // Desi Gamification: Saffron, White, and Green (Tiranga/Marigold Theme)
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: ['#FF9933', '#FFFFFF', '#138808', '#FFD700']
                    });
                }
                return { ...h, completed: !h.completed };
            }
            return h;
        }));
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
                        className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md"
                    >
                        <Plus className="h-5 w-5" />
                    </motion.button>
                </header>

                {/* Apple Health Sync Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500">
                            <Heart className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-rose-500">Apple Health Synced</p>
                            <p className="text-xs text-muted-foreground">Steps & workouts tracked automatically.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Heatmap Preview */}
                <div className="p-5 rounded-3xl bg-secondary/30 backdrop-blur-md border border-border/50">
                    <h3 className="text-sm font-medium mb-3">Activity Heatmap</h3>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 28 }).map((_, i) => (
                            <div
                                key={i}
                                className={`aspect-square rounded-md ${Math.random() > 0.3 ? 'bg-primary/80' : 'bg-primary/20'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Habits List with Dependency Chain */}
                <div className="space-y-3 relative">
                    <h3 className="text-lg font-medium mb-4">Today&apos;s Habits</h3>

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
                                    onDragEnd={(e, info) => {
                                        if (info.offset.x < -80) {
                                            setItems(items.filter(h => h.id !== habit.id));
                                            hapticFeedback.heavy();
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
                            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 sm:p-6 pb-safe"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 100 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 100 }}
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
            </div>
        </div>
    );
}
