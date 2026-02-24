'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuraBackground() {
    const pathname = usePathname();

    // Determine glow color based on route
    let auraColor = 'bg-primary/5'; // Default subtle primary

    if (pathname.includes('/habits')) {
        auraColor = 'bg-emerald-500/10'; // Green for growth/habits
    } else if (pathname.includes('/expenses')) {
        auraColor = 'bg-indigo-500/10'; // Blue/Indigo for finance
    } else if (pathname.includes('/profile')) {
        auraColor = 'bg-fuchsia-500/10'; // Pink/Purple for personal
    } else if (pathname === '/') {
        auraColor = 'bg-amber-500/10'; // Warm gold for dashboard/momentum
    } else if (pathname.includes('/breathe')) {
        auraColor = 'bg-cyan-500/20'; // Cool cyan for breathing
    }

    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden flex items-start justify-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className={`w-[200vw] h-[100vw] sm:w-[80vw] sm:h-[80vw] rounded-full blur-[100px] sm:blur-[140px] absolute -top-[20%] ${auraColor}`}
                />
            </AnimatePresence>
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px]"></div>
        </div>
    );
}
