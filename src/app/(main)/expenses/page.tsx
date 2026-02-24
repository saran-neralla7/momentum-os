'use client';

import { motion } from 'framer-motion';
import { Plus, Coffee, ShoppingBag, Car, Home as HomeIcon } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const expenseCategories = [
    { name: 'Food & Dining', value: 450, fill: '#4F46E5', icon: Coffee },
    { name: 'Shopping', value: 300, fill: '#0EA5E9', icon: ShoppingBag },
    { name: 'Transport', value: 150, fill: '#10B981', icon: Car },
    { name: 'Housing', value: 340, fill: '#F59E0B', icon: HomeIcon },
];

export default function ExpensesPage() {
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
                    className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md"
                >
                    <Plus className="h-5 w-5" />
                </motion.button>
            </header>

            {/* Monthly Summary */}
            <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <div className="text-3xl font-semibold mt-1">₹1,240<span className="text-xl text-muted-foreground">.00</span></div>
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
                            data={expenseCategories}
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
                    {expenseCategories.map((expense, i) => {
                        const Icon = expense.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-between m-1"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${expense.fill}20`, color: expense.fill }}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{expense.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Today, 2:40 PM</p>
                                    </div>
                                </div>
                                <div className="font-semibold text-right">
                                    -₹{expense.value}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
