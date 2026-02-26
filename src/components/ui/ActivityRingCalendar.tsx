'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ActivityRing = ({ radius, stroke, progress, color, offset }: { radius: number, stroke: number, progress: number, color: string, offset: number }) => {
    const normalizedRadius = radius - offset;
    // ensure radius is positive
    if (normalizedRadius <= 0) return null;

    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
        />
    );
};

const DailyRings = ({ size = 40, p1 = 0, p2 = 0, p3 = 0, dateNum, isActive }: any) => {
    const center = size / 2;
    const stroke = size * 0.1;

    // Add a slight delay for the animation to look like Apple Fitness
    const [animated, setAnimated] = useState({ p1: 0, p2: 0, p3: 0 });

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimated({ p1, p2, p3 });
        }, 100);
        return () => clearTimeout(timer);
    }, [p1, p2, p3]);

    return (
        <div className={`relative flex items-center justify-center rounded-full transition-all ${isActive ? 'bg-secondary/50 scale-110' : ''}`} style={{ width: size, height: size }}>
            <svg height={size} width={size} className="absolute inset-0 drop-shadow-md">
                {/* Track Rings */}
                <circle stroke="#ef444420" fill="transparent" strokeWidth={stroke} r={center - stroke} cx={center} cy={center} />
                <circle stroke="#22c55e20" fill="transparent" strokeWidth={stroke} r={center - stroke * 2.5} cx={center} cy={center} />
                <circle stroke="#06b6d420" fill="transparent" strokeWidth={stroke} r={center - stroke * 4} cx={center} cy={center} />

                {/* Progress Rings - Red, Green, Cyan to mimic Move, Exercise, Stand */}
                <ActivityRing radius={center} stroke={stroke} progress={animated.p1} color="#ef4444" offset={stroke} />
                <ActivityRing radius={center} stroke={stroke} progress={animated.p2} color="#22c55e" offset={stroke * 2.5} />
                <ActivityRing radius={center} stroke={stroke} progress={animated.p3} color="#06b6d4" offset={stroke * 4} />
            </svg>
            <span className="text-[11px] font-bold z-10 text-foreground/80">{dateNum}</span>
        </div>
    )
}

export default function ActivityRingCalendar({ onClose }: { onClose: () => void }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [logs, setLogs] = useState<any[]>([]);
    const [habits, setHabits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    useEffect(() => {
        const fetchMonthData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch habits to know how many there are to group them into 3 rings
            const { data: userHabits } = await supabase.from('habits').select('*').eq('user_id', user.id);
            if (userHabits) {
                setHabits(userHabits);
            }

            // 2. Fetch logs for this specific month
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startOfMonth = new Date(year, month, 1).toISOString();
            // Go to next month, day 0 (which is last day of current month)
            const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

            const { data: monthLogs } = await supabase.from('habit_logs')
                .select('habit_id, date, completed')
                .gte('date', startOfMonth)
                .lte('date', endOfMonth)
                .eq('completed', true);

            if (monthLogs) {
                setLogs(monthLogs);
            }
            setLoading(false);
        };

        fetchMonthData();
    }, [currentDate]);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Calculate grid
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

    const days = [];
    // Pad empty days
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    // Function to calculate percentages for the 3 rings for a given day
    const getRingPercentages = (dayNum: number) => {
        if (!dayNum || habits.length === 0) return { p1: 0, p2: 0, p3: 0 };

        const dateStr = new Date(year, month, dayNum).toISOString().split('T')[0];
        const dayLogs = logs.filter(l => l.date === dateStr);

        // Map habits into 3 arbitrary groups to represent the 3 rings (Red, Green, Blue)
        const group1 = habits.filter((_, i) => i % 3 === 0);
        const group2 = habits.filter((_, i) => i % 3 === 1);
        const group3 = habits.filter((_, i) => i % 3 === 2);

        const calcGroupProgress = (group: any[]) => {
            if (group.length === 0) return 0;
            const completedInGroup = dayLogs.filter(log => group.some(h => h.id === log.habit_id)).length;
            return Math.min(100, (completedInGroup / group.length) * 100);
        };

        return {
            p1: calcGroupProgress(group1),
            p2: calcGroupProgress(group2),
            p3: calcGroupProgress(group3)
        };
    };

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 pb-safe"
        >
            <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-secondary/50 rounded-full hover:bg-secondary z-50">
                <X className="h-6 w-6 text-foreground" />
            </button>

            <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.4 }}
                className="w-full max-w-sm"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-1">Activity</h2>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest">Momentum Rings</p>
                </div>

                <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-2xl">
                    {/* Header: Month / Year Controls */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-full transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <h3 className="text-lg font-semibold w-32 text-center">
                            {monthNames[month]} {year}
                        </h3>
                        <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-full transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-y-4 gap-x-2 justify-items-center">
                        {loading ? (
                            <div className="col-span-7 flex justify-center py-12">
                                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : (
                            days.map((day, i) => {
                                if (day === null) {
                                    return <div key={`empty-${i}`} className="w-10 h-10"></div>;
                                }

                                const { p1, p2, p3 } = getRingPercentages(day);
                                const isToday = todayStr === new Date(year, month, day).toISOString().split('T')[0];

                                return (
                                    <DailyRings
                                        key={day}
                                        dateNum={day}
                                        size={42}
                                        p1={p1}
                                        p2={p2}
                                        p3={p3}
                                        isActive={isToday}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        <span className="text-xs text-muted-foreground font-medium uppercase">Group A</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <span className="text-xs text-muted-foreground font-medium uppercase">Group B</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                        <span className="text-xs text-muted-foreground font-medium uppercase">Group C</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
