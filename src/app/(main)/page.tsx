'use client';

import { getDynamicGreeting, calculateMomentumScore } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import MascotOrb from '@/components/ui/MascotOrb';
import { Share, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '@/lib/LanguageContext';

const expenseData = [
    { name: '1', value: 120 },
    { name: '5', value: 400 },
    { name: '10', value: 50 },
    { name: '15', value: 300 },
    { name: '20', value: 800 },
    { name: '25', value: 200 },
    { name: '30', value: 900 },
];

export default function DashboardPage() {
    const { t } = useLanguage();
    const [greeting, setGreeting] = useState('');
    const [showAiInsight, setShowAiInsight] = useState(false);
    const [activeRoast, setActiveRoast] = useState('roast_1');
    const dashboardRef = useRef<HTMLDivElement>(null);

    // Mock data for calculation
    const mockHabits = [
        { streak: 12, completed: true },
        { streak: 5, completed: false },
        { streak: 28, completed: true }
    ];
    const score = calculateMomentumScore(mockHabits, 1240, 3000);

    useEffect(() => {
        setGreeting(getDynamicGreeting());
    }, []);

    const exportDashboard = async () => {
        if (!dashboardRef.current) return;
        try {
            const canvas = await html2canvas(dashboardRef.current, {
                backgroundColor: '#000000',
                scale: 2,
            });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = 'Momentum-Summary.png';
            link.click();
        } catch (error) {
            console.error('Failed to export dashboard:', error);
        }
    };

    return (
        <div className="pb-24">
            <div ref={dashboardRef} className="p-6 pt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-lg mx-auto bg-background min-h-screen">
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">{greeting || "Loading..."}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setActiveRoast(Math.random() > 0.5 ? 'roast_1' : 'roast_2');
                                setShowAiInsight(true);
                            }}
                            className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                            <Sparkles className="h-5 w-5" />
                        </button>
                        <button onClick={exportDashboard} className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                            <Share className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <MascotOrb score={score} />

                {/* Main Widgets Container */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Momentum Score Widget */}
                    <motion.div
                        whileHover={{ scale: 0.98 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-5 rounded-3xl bg-secondary/30 backdrop-blur-md border border-border/50 shadow-sm flex flex-col justify-between aspect-square relative overflow-hidden"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl rounded-full" />
                        <p className="text-sm text-muted-foreground font-medium relative z-10">Momentum Score</p>
                        <div className="relative z-10">
                            <div className="text-4xl font-bold text-foreground drop-shadow-md">{score}</div>
                            <p className="text-xs text-primary mt-1 font-medium">Top 5% of users 🌟</p>
                        </div>
                    </motion.div>

                    {/* Expense Widget */}
                    <motion.div
                        whileHover={{ scale: 0.98 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-5 rounded-3xl bg-secondary/30 backdrop-blur-md border border-border/50 shadow-sm flex flex-col justify-between aspect-square"
                    >
                        <p className="text-sm text-muted-foreground font-medium">Spent</p>
                        <div>
                            <div className="text-3xl font-semibold">₹1.2k</div>
                            <p className="text-xs text-muted-foreground mt-1">of ₹3k budget</p>
                        </div>
                    </motion.div>
                </div>

                {/* Chart Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-3xl bg-secondary/20 backdrop-blur-md border border-border/50 shadow-sm"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-medium">Expense Activity</h2>
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">This Month</span>
                    </div>

                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={expenseData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'oklch(0.12 0 0)', borderRadius: '1rem', border: '1px solid oklch(1 0 0 / 12%)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#4F46E5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* AI Insight Modal */}
            <AnimatePresence>
                {showAiInsight && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-card border border-border/50 shadow-2xl rounded-3xl p-6 relative"
                        >
                            <button onClick={() => setShowAiInsight(false)} className="absolute top-4 right-4 p-2 bg-secondary/50 rounded-full hover:bg-secondary">
                                <X className="h-4 w-4" />
                            </button>
                            <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight mb-2 flex items-center gap-2">
                                {t('ai_assessment')}
                            </h2>
                            <p className="text-sm text-foreground/90 font-medium leading-relaxed p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                                "{t(activeRoast)}"
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
