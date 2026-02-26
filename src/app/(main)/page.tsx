'use client';

import { getDynamicGreeting, calculateMomentumScore, hapticFeedback } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import MascotOrb from '@/components/ui/MascotOrb';
import { Share, Sparkles, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { useMomentum } from '@/contexts/MomentumContext';

export default function DashboardPage() {
    const { t } = useLanguage();
    const [greeting, setGreeting] = useState('');
    const [showAiInsight, setShowAiInsight] = useState(false);
    const [activeRoast, setActiveRoast] = useState('roast_1');
    const { score, refreshScore } = useMomentum();
    const [monthlyExpense, setMonthlyExpense] = useState(0);
    const [expenseData, setExpenseData] = useState<any[]>([]);
    const dashboardRef = useRef<HTMLDivElement>(null);
    const lockscreenRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const [budgetLimit, setBudgetLimit] = useState(3000);

    useEffect(() => {
        setGreeting(getDynamicGreeting());

        const fetchDashboardCharts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch expenses for chart
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const { data: expenses } = await supabase.from('expenses').select('amount, date').eq('user_id', user.id).order('date', { ascending: true });
                let totalExp = 0;
                let chartPoints: any[] = [];
                if (expenses) {
                    const thisMonthExpenses = expenses.filter(e => {
                        const d = new Date(e.date);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    });
                    totalExp = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
                    chartPoints = thisMonthExpenses.map(e => ({ name: new Date(e.date).getDate().toString(), value: Number(e.amount) }));
                }
                setMonthlyExpense(totalExp);
                setExpenseData(chartPoints);

                // Fetch real budget setting for UI display
                const { data: budgetData } = await supabase.from('budgets').select('limit_amount').eq('user_id', user.id).eq('category', 'Monthly').single();
                if (budgetData) {
                    setBudgetLimit(budgetData.limit_amount);
                }
            }
        };
        fetchDashboardCharts();
        refreshScore();
    }, [refreshScore]);

    const exportDashboard = async () => {
        if (!lockscreenRef.current) return;
        setIsExporting(true);
        hapticFeedback.medium();

        // Brief delay to ensure the off-screen template is rendered if depending on state
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(lockscreenRef.current, {
                backgroundColor: '#000000',
                scale: 3, // High-res export
                width: 400,
                height: 711,
                useCORS: true,
                logging: false
            });
            const image = canvas.toDataURL('image/png');

            // Try Native Share API first
            if (navigator.share) {
                try {
                    const blob = await (await fetch(image)).blob();
                    const file = new File([blob], 'Momentum-Lockscreen.png', { type: 'image/png' });
                    await navigator.share({
                        title: 'My Momentum Summary',
                        files: [file]
                    });
                } catch (shareError) {
                    console.log("Share API fall through:", shareError);
                    fallbackDownload(image);
                }
            } else {
                fallbackDownload(image);
            }
            hapticFeedback.heavy();
        } catch (error) {
            console.error('Failed to export dashboard:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const fallbackDownload = (image: string) => {
        const link = document.createElement('a');
        link.href = image;
        link.download = 'Momentum-Lockscreen.png';
        link.click();
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
                        <button
                            onClick={exportDashboard}
                            disabled={isExporting}
                            className={`h-10 px-4 flex items-center justify-center gap-2 rounded-full font-medium transition-colors ${isExporting ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'}`}
                        >
                            <Smartphone className="h-4 w-4" />
                            <span className="text-sm">{isExporting ? 'Saving...' : 'Wallpaper'}</span>
                        </button>
                    </div>
                </header>

                <MascotOrb />

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
                            <div className="text-3xl font-semibold">₹{monthlyExpense.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">of ₹{budgetLimit >= 1000 ? `${(budgetLimit / 1000).toFixed(0)}k` : budgetLimit} budget</p>
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

            {/* Hidden Lockscreen Export Template (9:16 aspect ratio) */}
            <div className={`fixed inset-0 pointer-events-none flex items-center justify-center z-[-50] ${isExporting ? 'opacity-100' : 'opacity-0'}`}>
                <div
                    ref={lockscreenRef}
                    className="w-[400px] h-[711px] bg-black text-white relative overflow-hidden flex flex-col p-8 font-sans"
                >
                    {/* Animated Premium Background Elements */}
                    <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-primary/40 blur-[80px] rounded-full" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-indigo-600/30 blur-[100px] rounded-full" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                    <div className="relative z-10 text-center mt-12 mb-auto">
                        <p className="text-xl font-medium tracking-widest text-white/50 uppercase">Momentum Report</p>
                        <h1 className="text-4xl font-bold mt-2 tracking-tight">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h1>
                    </div>

                    <div className="relative z-10 space-y-6 mb-16">
                        {/* Score Card */}
                        <div className="relative p-6 bg-white/5 border border-white/20 rounded-3xl backdrop-blur-2xl shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl pointer-events-none" />
                            <p className="text-xs font-bold text-white/50 uppercase tracking-[0.2em]">Momentum Score</p>
                            <div className="text-7xl font-black mt-2 bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent drop-shadow-lg leading-tight">
                                {score}
                            </div>
                            <p className="text-sm mt-2 text-primary/80 font-medium">Top 5% performer 🔥</p>
                        </div>

                        {/* Financial Card */}
                        <div className="relative p-6 bg-white/5 border border-white/20 rounded-3xl backdrop-blur-2xl shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl pointer-events-none" />
                            <p className="text-xs font-bold text-white/50 uppercase tracking-[0.2em]">Spent This Month</p>
                            <div className="text-5xl font-bold mt-2 text-white/90 tracking-tight">
                                ₹{monthlyExpense.toLocaleString()}
                            </div>
                            <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (monthlyExpense / budgetLimit) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 text-center mt-auto pb-4 opacity-40 text-[10px] font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                        <Sparkles className="h-3 w-3" /> Built with Momentum OS
                    </div>
                </div>
            </div>
        </div>
    );
}
