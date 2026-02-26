'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!mounted) return;

                const isAuthRoute = pathname === '/login' || pathname === '/signup';

                if (session) {
                    // Logged in user trying to access login/signup page -> redirect to dashboard
                    if (isAuthRoute) {
                        router.replace('/');
                    } else {
                        // Logged in user accessing protected page -> allow access
                        setIsLoading(false);
                    }
                } else {
                    // Unauthenticated user trying to access protected page -> redirect to login
                    if (!isAuthRoute) {
                        router.replace('/login');
                    } else {
                        // Unauthenticated user accessing login/signup -> allow access
                        setIsLoading(false);
                    }
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                if (mounted) setIsLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const isAuthRoute = pathname === '/login' || pathname === '/signup';

            if (event === 'SIGNED_OUT' && !isAuthRoute) {
                router.replace('/login');
            } else if (event === 'SIGNED_IN' && isAuthRoute) {
                router.replace('/');
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [pathname, router]);

    // Show a sleek Momentum OS branded loading screen while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background pointer-events-none">
                <div className="h-16 w-16 bg-primary rounded-3xl shadow-2xl flex items-center justify-center animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-background rotate-45 transform" />
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
