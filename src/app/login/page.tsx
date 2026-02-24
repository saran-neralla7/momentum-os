'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleAuth = async (isSignUp: boolean) => {
        setLoading(true);
        setError(null);

        try {
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
                throw new Error("Supabase is not configured. Please see SUPABASE_SETUP.md.");
            }

            const { error } = isSignUp
                ? await supabase.auth.signUp({ email, password })
                : await supabase.auth.signInWithPassword({ email, password });

            if (error) throw error;
            router.push('/');
        } catch (err: any) {
            console.error("Full Auth Error:", err);
            setError(err.message || 'An unknown error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-background">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-2">
                    <div className="h-16 w-16 bg-primary mx-auto rounded-3xl mb-6 shadow-2xl flex items-center justify-center">
                        <div className="w-8 h-8 rounded-xl bg-background rotate-45 transform" />
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight">Momentum OS</h1>
                    <p className="text-muted-foreground">Sign in to your premium planner</p>
                </div>

                <div className="space-y-4 pt-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="hello@apple.com"
                            className="flex h-12 w-full rounded-2xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="flex h-12 w-full rounded-2xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            onClick={() => handleAuth(false)}
                            disabled={loading || !email || !password}
                            className="w-full h-12 flex items-center justify-center rounded-2xl bg-primary text-primary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                        </button>
                        <button
                            onClick={() => handleAuth(true)}
                            disabled={loading || !email || !password}
                            className="w-full h-12 flex items-center justify-center rounded-2xl bg-secondary text-secondary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Create Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
