'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Coffee, ShoppingBag, Car, Home as HomeIcon, X, DollarSign } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { supabase } from '@/lib/supabase';
import { hapticFeedback } from '@/lib/utils';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Food & Dining');
    const [monthlyTotal, setMonthlyTotal] = useState(0);

    useEffect(() => {
        const fetchExpenses = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false });
                if (data) {
                    setExpenses(data);
                    const total = data.reduce((sum, exp) => sum + Number(exp.amount), 0);
                    setMonthlyTotal(total);
                }
            }
        };
        fetchExpenses();
    }, []);

    const handleAddExpense = async () => {
        hapticFeedback.light();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && amount && description) {
            const { data, error } = await supabase.from('expenses').insert([
                { user_id: user.id, amount: Number(amount), category, description, date: new Date().toISOString() }
            ]).select();

            if (data) {
                const newExpenses = [data[0], ...expenses];
                setExpenses(newExpenses);
                setMonthlyTotal(newExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0));
                setAmount('');
                setDescription('');
                setShowAddModal(false);
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
                <div className="bg-card p-4 rounded-3xl border border-border/50 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Budget Limit</p>
                    <div className="text-xl font-medium mt-1">₹3,000</div>
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
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                { category: 'Food', initial: 120, current: 450, fullMark: 600 },
                                { category: 'Shop', initial: 80, current: 300, fullMark: 500 },
                                { category: 'Trans', initial: 50, current: 150, fullMark: 300 },
                                { category: 'House', initial: 340, current: 340, fullMark: 800 },
                                { category: 'Subs', initial: 20, current: 100, fullMark: 200 },
                            ]}>
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
                    </div>
                </motion.div>
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

            {/* Add Expense Modal */}
            <AnimatePresence>
                {showAddModal && (
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
                                        className="w-full mt-1 h-12 px-4 bg-secondary/30 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
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
                                        placeholder="Coffee, Groceries..."
                                    />
                                </div>
                                <button
                                    onClick={handleAddExpense}
                                    disabled={!amount || !description}
                                    className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-2"
                                >
                                    Log Expense
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
