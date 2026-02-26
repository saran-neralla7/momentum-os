'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '@/contexts/MomentumContext';

export default function AuraBackground() {
    const pathname = usePathname();

    const { auraColor } = useMomentum();

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
