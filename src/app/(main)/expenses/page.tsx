'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Coffee, ShoppingBag, Car, Home as HomeIcon, X, DollarSign, AlertOctagon } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { supabase } from '@/lib/supabase';
import { hapticFeedback } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Food & Dining');
    const [monthlyTotal, setMonthlyTotal] = useState(0);

    const [budgetLimit, setBudgetLimit] = useState(3000);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [newBudgetInput, setNewBudgetInput] = useState('');

    const { t } = useLanguage();
    const [showRoastModal, setShowRoastModal] = useState(false);
    const [roastBypassed, setRoastBypassed] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    const [radarData, setRadarData] = useState<any[]>([]);

    useEffect(() => {
        const fetchExpensesAndBudget = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch Expenses
                const { data: expData } = await supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false });
                if (expData) {
                    setExpenses(expData);

                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

                    let currentMonthTotal = 0;

                    const categories = ['Food & Dining', 'Shopping', 'Transportation', 'Subscription', 'Other'];
                    const shortCategories = ['Food', 'Shop', 'Trans', 'Subs', 'Other'];

                    const radarStats = categories.map((cat, index) => {
                        let current = 0;
                        let initial = 0;

                        expData.forEach(exp => {
                            const expDate = new Date(exp.date);
                            if (exp.category === cat) {
                                if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                                    current += Number(exp.amount);
                                } else if (expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear) {
                                    initial += Number(exp.amount);
                                }
                            }
                        });

                        return {
                            category: shortCategories[index],
                            initial,
                            current,
                            fullMark: Math.max(initial, current, 100) * 1.2
                        };
                    });

                    // Total for this month only for budget
                    expData.forEach(exp => {
                        const expDate = new Date(exp.date);
                        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                            currentMonthTotal += Number(exp.amount);
                        }
                    });

                    setMonthlyTotal(currentMonthTotal);
                    setRadarData(radarStats);
                }

                // Fetch Budget
                const { data: budgetData } = await supabase.from('budgets').select('limit_amount').eq('user_id', user.id).eq('category', 'Monthly').single();
                if (budgetData) {
                    setBudgetLimit(budgetData.limit_amount);
                }
            }
        };
        fetchExpensesAndBudget();
    }, []);

    const handleUpdateBudget = async () => {
        hapticFeedback.light();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && newBudgetInput) {
            const amount = Number(newBudgetInput);
            const { error } = await supabase.from('budgets').upsert(
                { user_id: user.id, category: 'Monthly', limit_amount: amount },
                { onConflict: 'user_id,category' }
            );

            if (!error) {
                setBudgetLimit(amount);
                setNewBudgetInput('');
                setShowBudgetModal(false);
            }
        }
    };

    const handleAddExpense = async () => {
        const expenseAmount = Number(amount);

        // Paisa-Vasool Intercept
        if (expenseAmount >= 1000 && !roastBypassed) {
            hapticFeedback.heavy();
            setShowRoastModal(true);
            return;
        }

        hapticFeedback.light();
        const { data: { user } } = await supabase.auth.getUser();

        if (user && amount && description) {
            const { data, error } = await supabase.from('expenses').insert([
                { user_id: user.id, amount: expenseAmount, category, description, date: new Date().toISOString() }
            ]).select();

            if (data) {
                const newExpenses = [data[0], ...expenses];
                setExpenses(newExpenses);
                setMonthlyTotal(newExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0));
                setAmount('');
                setDescription('');
                setShowAddModal(false);
                setRoastBypassed(false); // Reset bypass
            } else if (error) {
                console.error("Failed to insert expense:", error);
            }
        }
    };
    return (
        <div className="p-6 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-lg mx-auto">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground mt-1">Track your spending perfectly.</p>
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

            {/* Monthly Summary */}
            <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <div className="text-3xl font-semibold mt-1">₹{monthlyTotal.toLocaleString()}<span className="text-xl text-muted-foreground">.00</span></div>
                </div>
                <div
                    className="bg-secondary/50 hover:bg-secondary cursor-pointer p-4 rounded-3xl border border-border/50 shadow-sm transition-colors"
                    onClick={() => {
                        setNewBudgetInput(budgetLimit.toString());
                        setShowBudgetModal(true);
                    }}
                >
                    <p className="text-sm font-medium text-muted-foreground">Budget Limit</p>
                    <div className="text-xl font-medium mt-1">₹{budgetLimit.toLocaleString()}</div>
                </div>
            </div>

            {/* Smart Expense Entry */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="text-lg">✨</span>
                </div>
                <input
                    type="text"
                    placeholder="E.g., Bought coffee for ₹250"
                    className="w-full bg-secondary text-secondary-foreground rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-inner transition-shadow"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                            // Haptic feel of a successful "magic" entry
                            if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                                navigator.vibrate([30, 50, 30]);
                            }
                            e.currentTarget.value = '';
                        }
                    }}
                />
            </motion.div>

            {/* Spending Velocity Radar */}
            <div className="space-y-3">
                <h3 className="text-lg font-medium">Spending Velocity</h3>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-3xl bg-secondary/20 backdrop-blur-md border border-border/50 flex flex-col items-center"
                >
                    <div className="h-64 w-full relative">
                        {radarData.length > 0 && radarData.some(d => d.initial > 0 || d.current > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="category" tick={{ fill: '#888', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                                    <Radar name="Last Month" dataKey="initial" stroke="#888" fill="#888" fillOpacity={0.2} />
                                    <Radar name="This Month" dataKey="current" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.5} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'oklch(0.12 0 0)', borderRadius: '1rem', border: 'none' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                                <div className="text-3xl opacity-40">🧭</div>
                                <p>Log expenses to unlock velocity.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Subscription Graveyard */}
            <div className="space-y-3">
                <h3 className="text-lg font-medium tracking-tight text-destructive flex items-center justify-between">
                    <span>Subscription Graveyard <span className="text-sm opacity-50 ml-1">💀</span></span>
                    <span className="text-xs font-semibold bg-destructive/10 px-2 py-1 rounded-full">
                        ₹{expenses.filter(e => e.category === 'Subscription').reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()} Wasted
                    </span>
                </h3>

                <div className="space-y-2">
                    {expenses.filter(e => e.category === 'Subscription').length === 0 ? (
                        <div className="p-4 rounded-2xl bg-secondary/20 border border-dashed border-border/50 text-center text-sm text-muted-foreground flex flex-col items-center justify-center min-h-[100px]">
                            <p>No active subscriptions found.</p>
                            <p className="text-xs opacity-70 mt-1">Select "Subscription" when logging an expense.</p>
                        </div>
                    ) : (
                        expenses.filter(e => e.category === 'Subscription').reduce((unique: any[], item) => {
                            // Simple deduplication logic for display based on description matching
                            if (!unique.some(u => u.description.toLowerCase().trim() === item.description.toLowerCase().trim())) {
                                unique.push(item);
                            }
                            return unique;
                        }, []).map((sub, i) => (
                            <motion.div
                                key={`sub-${sub.id}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative w-full overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/5"
                            >
                                <div className="absolute inset-y-0 right-0 w-24 bg-destructive flex items-center justify-center text-destructive-foreground font-bold text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity z-0 cursor-pointer"
                                    onClick={() => {
                                        hapticFeedback.medium();
                                        window.open(`https://google.com/search?q=how+to+cancel+${encodeURIComponent(sub.description)}+subscription`, '_blank');
                                    }}>
                                    Cancel
                                </div>

                                <motion.div
                                    drag="x"
                                    dragConstraints={{ left: -96, right: 0 }}
                                    dragElastic={0.05}
                                    className="relative z-10 p-4 bg-card shadow-sm flex items-center justify-between border-l-4 border-l-destructive cursor-grab active:cursor-grabbing"
                                >
                                    <div>
                                        <h4 className="font-semibold">{sub.description}</h4>
                                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                            <AlertOctagon className="h-3 w-3 text-destructive" /> Recurring Charge
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-destructive">₹{sub.amount}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 font-semibold">Per Month</div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-3xl bg-secondary/20 backdrop-blur-md border border-border/50 flex flex-col items-center"
            >
                <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="30%"
                            outerRadius="100%"
                            barSize={12}
                            data={[{ name: 'Spent', value: monthlyTotal || 1, fill: '#4F46E5' }]}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <RadialBar
                                background={{ fill: '#ffffff10' }}
                                dataKey="value"
                                cornerRadius={10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'oklch(0.12 0 0)', borderRadius: '1rem', border: 'none' }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{ fill: 'transparent' }}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-xs text-muted-foreground w-16 text-center leading-tight mt-2">Budget Health</span>
                    </div>
                </div>
            </motion.div>

            {/* Recent Transactions */}
            <div className="space-y-3">
                <h3 className="text-lg font-medium flex justify-between items-center">
                    Recent
                    <span className="text-xs text-primary cursor-pointer hover:underline">View All</span>
                </h3>
                <div className="space-y-3">
                    {expenses.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm border border-dashed border-border/50 rounded-2xl">
                            No expenses yet. Tap + to add one.
                        </div>
                    ) : (
                        expenses.slice(0, 5).map((expense, i) => {
                            let Icon = DollarSign;
                            let color = '#4F46E5';
                            if (expense.category === 'Food & Dining') { Icon = Coffee; color = '#F59E0B'; }
                            if (expense.category === 'Shopping') { Icon = ShoppingBag; color = '#0EA5E9'; }

                            return (
                                <motion.div
                                    key={expense.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-between m-1"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}20`, color: color }}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm">{expense.description}</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(expense.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-right">
                                        -₹{expense.amount}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>



            {/* Edit Budget Modal */}
            <AnimatePresence>
                {showBudgetModal && (
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
                            <button onClick={() => setShowBudgetModal(false)} className="absolute top-4 right-4 p-2 bg-secondary/50 rounded-full hover:bg-secondary">
                                <X className="h-4 w-4" />
                            </button>
                            <h2 className="text-xl font-bold tracking-tight mb-4">Set Monthly Budget</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Limit (₹)</label>
                                    <input
                                        type="number"
                                        value={newBudgetInput}
                                        onChange={(e) => setNewBudgetInput(e.target.value)}
                                        className="w-full mt-1 h-12 px-4 bg-secondary/30 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                                        placeholder="E.g., 5000"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateBudget}
                                    disabled={!newBudgetInput}
                                    className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-2"
                                >
                                    Save Limit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Expense Modal */}
            <AnimatePresence>
                {showAddModal && !showRoastModal && (
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
                            <h2 className="text-xl font-bold tracking-tight mb-4">New Expense</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full mt-1 h-12 px-4 bg-secondary/30 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base font-semibold"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Description</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full mt-1 h-12 px-4 bg-secondary/30 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                                        placeholder="E.g., Dinner with friends"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full mt-1 h-12 px-4 bg-secondary/30 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base appearance-none"
                                    >
                                        <option value="Food & Dining">Food & Dining</option>
                                        <option value="Shopping">Shopping</option>
                                        <option value="Transportation">Transportation</option>
                                        <option value="Subscription">Subscription</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddExpense}
                                    disabled={!amount || !description || isLocating}
                                    className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                                >
                                    {isLocating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            Detecting Location...
                                        </>
                                    ) : (
                                        'Log Expense'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Paisa Vasool Roast Modal */}
            <AnimatePresence>
                {showRoastModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 pb-safe"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50, opacity: 0 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                            className="w-full max-w-sm bg-destructive/10 border-2 border-destructive shadow-2xl rounded-3xl p-6 relative flex flex-col items-center text-center overflow-hidden"
                        >
                            {/* Dramatic background effect */}
                            <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />

                            <div className="h-16 w-16 bg-destructive/20 rounded-full flex items-center justify-center text-destructive mb-4 shadow-inner relative z-10">
                                <AlertOctagon className="h-8 w-8" />
                            </div>

                            <h2 className="text-2xl font-black tracking-tighter text-destructive mb-2 uppercase relative z-10">
                                Paisa-Vasool Alert
                            </h2>

                            <p className="text-foreground text-lg font-medium leading-snug mb-6 relative z-10">
                                {Math.random() > 0.5 ? t('roast_1') : t('roast_2')}
                            </p>

                            <div className="w-full space-y-3 relative z-10">
                                <button
                                    onClick={() => {
                                        hapticFeedback.light();
                                        setShowRoastModal(false);
                                        setRoastBypassed(false);
                                        setAmount('');
                                        setDescription('');
                                        setShowAddModal(false);
                                    }}
                                    className="w-full h-12 bg-destructive text-destructive-foreground rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                                >
                                    Cancel & Save Money
                                </button>
                                <button
                                    onClick={() => {
                                        hapticFeedback.light();
                                        setRoastBypassed(true);
                                        setShowRoastModal(false);
                                    }}
                                    className="w-full h-12 bg-transparent text-muted-foreground border border-border/50 rounded-xl font-medium transition-colors hover:bg-secondary/50 active:scale-95"
                                >
                                    I know what I'm doing (Proceed)
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
