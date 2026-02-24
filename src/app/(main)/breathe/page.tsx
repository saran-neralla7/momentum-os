'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function BreathePage() {
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

    useEffect(() => {
        const cycle = () => {
            setPhase('Inhale');
            setTimeout(() => {
                setPhase('Hold');
                setTimeout(() => {
                    setPhase('Exhale');
                }, 2000); // Hold for 2s
            }, 4000); // Inhale for 4s
        };

        cycle();
        const interval = setInterval(cycle, 10000); // Total cycle 10s (4 in, 2 hold, 4 out)
        return () => clearInterval(interval);
    }, []);

    // Animation variants based on phase
    const circleVariants = {
        Inhale: { scale: 1.5, opacity: 0.8, transition: { duration: 4, ease: "easeOut" } },
        Hold: { scale: 1.5, opacity: 0.8, transition: { duration: 2 } },
        Exhale: { scale: 1, opacity: 0.3, transition: { duration: 4, ease: "easeInOut" } },
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#000000] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <Link href="/" className="absolute top-8 left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/50 hover:text-white">
                <X className="h-6 w-6" />
            </Link>

            <h1 className="absolute top-24 text-white/50 tracking-[0.3em] uppercase text-sm font-medium">Clear Your Mind</h1>

            {/* Breathing Animation Container */}
            <div className="relative w-64 h-64 flex items-center justify-center mt-12">
                {/* Center Core */}
                <motion.div
                    className="absolute w-8 h-8 rounded-full bg-cyan-400 blur-sm z-10"
                    animate={phase}
                    variants={{
                        Inhale: { scale: 1.2 },
                        Hold: { scale: 1.2 },
                        Exhale: { scale: 1 }
                    }}
                />

                {/* Multiple overlapping circles for the "flower" effect */}
                {[0, 45, 90, 135].map((rotation, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-32 h-32 rounded-full border border-cyan-400/30 bg-cyan-500/10 mix-blend-screen"
                        style={{ rotate: rotation }}
                        animate={phase}
                        variants={{
                            Inhale: { scale: 1.8, borderRadius: "40%", rotate: rotation + 45, transition: { duration: 4, ease: "easeOut" } },
                            Hold: { scale: 1.8, borderRadius: "40%", rotate: rotation + 45, transition: { duration: 2 } },
                            Exhale: { scale: 1, borderRadius: "50%", rotate: rotation, transition: { duration: 4, ease: "easeInOut" } }
                        }}
                    />
                ))}
            </div>

            <motion.h2
                key={phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 1 }}
                className="mt-24 text-3xl font-light tracking-wide text-cyan-100"
            >
                {phase}...
            </motion.h2>
        </div>
    );
}
