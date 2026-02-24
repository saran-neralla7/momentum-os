'use client';

import { motion } from 'framer-motion';
import { Target, X, Play, Pause, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function FocusPage() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        setIsActive(!isActive);
        if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) navigator.vibrate(50);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(25 * 60);
        if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) navigator.vibrate(50);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center">
            <Link href="/habits" className="absolute top-8 left-8 p-3 rounded-full bg-secondary/50 hover:bg-secondary transition-colors">
                <X className="h-6 w-6" />
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center w-full max-w-sm"
            >
                <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mb-8 relative">
                    <motion.div
                        animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-primary/10"
                    />
                    <Target className="h-10 w-10 text-primary relative z-10" />
                </div>

                <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-2">Monk Mode</h2>
                <h1 className="text-3xl font-semibold tracking-tight leading-tight mb-8 text-muted-foreground">Code for 2 hours</h1>

                {/* Timer Display */}
                <div className="text-7xl font-light tracking-tighter mb-12 tabular-nums">
                    {formatTime(timeLeft)}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 mb-12">
                    <button onClick={resetTimer} className="h-14 w-14 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
                        <RotateCcw className="h-6 w-6" />
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleTimer}
                        className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30"
                    >
                        {isActive ? <Pause className="h-8 w-8" fill="currentColor" /> : <Play className="h-8 w-8 ml-1" fill="currentColor" />}
                    </motion.button>
                </div>

                {timeLeft === 0 && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                                navigator.vibrate([100, 50, 100]);
                            }
                        }}
                        className="h-16 px-12 rounded-full bg-green-500 text-white text-lg font-medium shadow-2xl shadow-green-500/30"
                    >
                        Mark Completed
                    </motion.button>
                )}
            </motion.div>
        </div>
    );
}
