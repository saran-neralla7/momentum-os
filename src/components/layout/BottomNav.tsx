'use client';

import { Home, ListTodo, PieChart, User, CloudOff, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

const navItemsKeys = [
    { key: 'dashboard', href: '/', icon: Home },
    { key: 'habits', href: '/habits', icon: ListTodo },
    { key: 'tasks', href: '/tasks', icon: CheckSquare },
    { key: 'expenses', href: '/expenses', icon: PieChart },
    { key: 'profile', href: '/profile', icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();
    const [isOffline, setIsOffline] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsOffline(!navigator.onLine);
            const handleOnline = () => setIsOffline(false);
            const handleOffline = () => setIsOffline(true);
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, []);

    return (
        <nav className="fixed bottom-0 w-full z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-1/2 -top-10 -translate-x-1/2 bg-destructive/90 text-destructive-foreground px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-md"
                    >
                        <CloudOff className="h-4 w-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Offline</span>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex justify-around items-center h-20 px-6 max-w-md mx-auto">
                {navItemsKeys.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center w-full h-full"
                        >
                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <Icon
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground'
                                        }`}
                                />
                                <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {t(item.key)}
                                </span>
                            </div>

                            {isActive && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    className="absolute inset-0 bg-secondary/50 rounded-2xl z-0"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
