'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Mail, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Steps: 1 = Email, 2 = OTP, 3 = Password, 4 = Success
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

    const router = useRouter();

    const handleSendOTP = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                }
            });
            if (error) throw error;

            setMessage("We've sent a 6-digit code to your email.");
            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email'
            });
            if (error) throw error;

            setMessage("Email verified! Please set your password.");
            setStep(3);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSetPassword = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });
            if (error) throw error;

            // Sign out immediately so they have to log in on the login page as requested
            await supabase.auth.signOut();

            setStep(4);
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
                    <h1 className="text-3xl font-semibold tracking-tight">Create Account</h1>
                    <p className="text-muted-foreground">Join Momentum OS today</p>
                </div>

                <div className="space-y-4 pt-4 w-full">
                    {error && (
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                            {error}
                        </div>
                    )}
                    {message && step !== 4 && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm text-center">
                            {message}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="hello@apple.com"
                                    className="flex h-12 w-full rounded-2xl border border-input bg-transparent px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                            <button
                                onClick={handleSendOTP}
                                disabled={loading || !email}
                                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Mail className="h-4 w-4" /> Send OTP</>}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Enter 6-Digit OTP</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="123456"
                                    className="flex h-12 w-full text-center tracking-[0.5em] font-mono text-xl rounded-2xl border border-input bg-transparent px-4 py-2 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                            <button
                                onClick={handleVerifyOTP}
                                disabled={loading || otp.length < 6}
                                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Email"}
                            </button>
                            <button
                                onClick={() => { setStep(1); setOtp(''); setError(null); setMessage(null); }}
                                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-transparent text-muted-foreground font-medium transition-colors hover:text-foreground text-sm"
                            >
                                <ArrowLeft className="h-4 w-4" /> Wrong Email? Go Back
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Set a Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
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
                            <button
                                onClick={handleSetPassword}
                                disabled={loading || password.length < 6}
                                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><KeyRound className="h-4 w-4" /> Complete Setup</>}
                            </button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-semibold tracking-tight">Account created!</h3>
                                <p className="text-muted-foreground">Your password has been set successfully.</p>
                            </div>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-medium transition-transform hover:scale-[0.98] active:scale-[0.95]"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="text-center mt-6">
                            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors">
                                Already have an account? Sign in.
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
