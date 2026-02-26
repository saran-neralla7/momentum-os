'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Clock, X, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { hapticFeedback } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface Task {
    id: string;
    title: string;
    due_time: string;
    completed: boolean;
    category: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDue, setNewTaskDue] = useState('');

    useEffect(() => {
        const fetchTasks = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('due_time', { ascending: true });
                if (data) setTasks(data);
            }
        };
        fetchTasks();
    }, []);

    const handleAddTask = async () => {
        hapticFeedback.light();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && newTaskTitle.trim() && newTaskDue) {
            const due_date = new Date(newTaskDue).toISOString();

            const { data, error } = await supabase.from('tasks').insert([
                { user_id: user.id, title: newTaskTitle, due_time: due_date, category: 'General' }
            ]).select();

            if (data && data.length > 0) {
                const newTasks = [...tasks, data[0] as Task].sort((a, b) => new Date(a.due_time).getTime() - new Date(b.due_time).getTime());
                setTasks(newTasks);
                setNewTaskTitle('');
                setNewTaskDue('');
                setShowAddModal(false);
            } else if (error) {
                console.error("Error adding task:", error);
            }
        }
    };

    const toggleTask = async (task: Task) => {
        hapticFeedback.light();
        const newStatus = !task.completed;

        // Optimistic UI update
        setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: newStatus } : t));

        if (newStatus) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4F46E5', '#10B981', '#F59E0B']
            });
        }

        const { error } = await supabase.from('tasks').update({ completed: newStatus }).eq('id', task.id);
        if (error) {
            // Revert on error
            setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
        }
    };

    const deleteTask = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        hapticFeedback.heavy();

        // Optimistic delete
        setTasks(tasks.filter(t => t.id !== id));

        // Database sync
        await supabase.from('tasks').delete().eq('id', id);
    };

    const isOverdue = (due_time: string, completed: boolean) => {
        if (completed) return false;
        return new Date(due_time).getTime() < new Date().getTime();
    };

    // Auto-update overdue states
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="pb-24">
            <div className="p-6 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-lg mx-auto bg-background min-h-screen">
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
                        <p className="text-muted-foreground mt-1">Focus. Execute. Delete.</p>
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

                <div className="space-y-4">
                    {tasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-8 text-center text-muted-foreground border border-dashed border-border/50 rounded-3xl bg-secondary/20"
                        >
                            <p>No pending targets.</p>
                            <p className="text-xs mt-1">Tap + to add one.</p>
                        </motion.div>
                    ) : (
                        <AnimatePresence>
                            {tasks.map((task) => {
                                const overdue = isOverdue(task.due_time, task.completed);

                                return (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, height: 0, overflow: 'hidden', padding: 0, margin: 0, borderWidth: 0 }}
                                        className={`relative z-10 p-4 border flex items-center justify-between transition-colors m-0 rounded-2xl group ${task.completed
                                            ? 'bg-primary/5 border-primary/10 opacity-60'
                                            : overdue
                                                ? 'bg-destructive/10 border-destructive/30 shadow-sm'
                                                : 'bg-card border-border/50 shadow-sm backdrop-blur-md hover:border-primary/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 w-full">
                                            <button onClick={() => toggleTask(task)} className="focus:outline-none shrink-0 cursor-pointer">
                                                {task.completed ? (
                                                    <CheckCircle2 className="h-6 w-6 text-primary" />
                                                ) : overdue ? (
                                                    <Circle className="h-6 w-6 text-destructive" />
                                                ) : (
                                                    <Circle className="h-6 w-6 text-muted-foreground" />
                                                )}
                                            </button>

                                            <div className="flex-1 min-w-0 pr-2">
                                                <h4 className={`font-medium truncate ${task.completed ? 'line-through text-muted-foreground' : ''} ${overdue && !task.completed ? 'text-destructive-foreground font-semibold' : ''}`}>
                                                    {task.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs flex items-center gap-1 font-medium ${overdue && !task.completed ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                        {overdue && !task.completed ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                        {new Date(task.due_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => deleteTask(task.id, e)}
                                            className="shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors focus:outline-none"
                                            aria-label="Delete task"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {/* Add Task Modal */}
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
                                <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 bg-secondary/50 rounded-full hover:bg-secondary cursor-pointer transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                                <h2 className="text-xl font-bold tracking-tight mb-4">New Target</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground ml-1">What needs to be done?</label>
                                        <input
                                            type="text"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            className="w-full mt-1 h-12 px-4 bg-secondary/30 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                                            placeholder="E.g., Review PRs, Buy Groceries..."
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground ml-1">Due Time</label>
                                        <input
                                            type="datetime-local"
                                            value={newTaskDue}
                                            onChange={(e) => setNewTaskDue(e.target.value)}
                                            className="w-full mt-1 h-12 px-4 bg-secondary/30 rounded-xl border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddTask}
                                        disabled={!newTaskTitle || !newTaskDue}
                                        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
                                    >
                                        Set Timebox
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
