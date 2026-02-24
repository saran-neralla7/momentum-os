'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, KeyRound, Mail, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [view, setView] = useState<'default' | 'forgot' | 'otp'>('default');
    const router = useRouter();

    const handleAuth = async (isSignUp: boolean) => {
        setLoading(true);
        setError(null);
        setMessage(null);

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

    const handlePasswordReset = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`,
            });
            if (error) throw error;
            setMessage("Password reset email sent! Check your inbox.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOTPLogin = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/`,
                },
            });
            if (error) throw error;
            setMessage("Magic Link + OTP sent to your email!");
        } catch (err: any) {
            setError(err.message);
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

                <div className="space-y-4 pt-4 w-full">
                    {error && (
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm text-center">
                            {message}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="hello@apple.com"
                            className="flex h-12 w-full rounded-2xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>

                    {view === 'default' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="flex h-12 w-full rounded-2xl border border-input bg-transparent px-4 py-2 pr-12 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                        {view === 'default' ? (
                            <>
                                <button
                                    onClick={() => handleAuth(false)}
                                    disabled={loading || !email || !password}
                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In / Create Account"}
                                </button>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        onClick={() => setView('otp')}
                                        className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-secondary text-secondary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95] text-sm"
                                    >
                                        <Mail className="h-4 w-4" /> Email OTP
                                    </button>
                                    <button
                                        onClick={() => setView('forgot')}
                                        className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-secondary text-secondary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95] text-sm"
                                    >
                                        <KeyRound className="h-4 w-4" /> Reset DB
                                    </button>
                                </div>
                            </>
                        ) : view === 'forgot' ? (
                            <>
                                <button
                                    onClick={handlePasswordReset}
                                    disabled={loading || !email}
                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
                                </button>
                                <button
                                    onClick={() => setView('default')}
                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-transparent text-muted-foreground font-medium transition-colors hover:text-foreground text-sm"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Back to Login
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleOTPLogin}
                                    disabled={loading || !email}
                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Magic OTP Link"}
                                </button>
                                <button
                                    onClick={() => setView('default')}
                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-transparent text-muted-foreground font-medium transition-colors hover:text-foreground text-sm"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Back to Password
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
