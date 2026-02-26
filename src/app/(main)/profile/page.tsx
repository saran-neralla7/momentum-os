'use client';

import { LogOut, Moon, Sun, Download, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || null);
            } else {
                router.push('/login');
            }
        };
        fetchUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };
    return (
        <div className="p-6 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-lg mx-auto">
            <header>
                <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
            </header>

            {/* User Card */}
            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 flex items-center gap-5">
                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-medium shadow-lg uppercase">
                    {userEmail ? userEmail.charAt(0) : ''}
                </div>
                <div>
                    <h2 className="text-xl font-semibold capitalize">
                        {userEmail ? userEmail.split('@')[0] : 'Loading...'}
                    </h2>
                    <p className="text-muted-foreground text-sm">{userEmail}</p>
                </div>
            </div>

            {/* Settings Options */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Preferences</h3>
                    <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
                        <div className="w-full flex items-center justify-between p-4 bg-transparent border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-lg">🌐</span>
                                <span className="font-medium">Language</span>
                            </div>
                            <select
                                onChange={(e) => {
                                    if (typeof window !== 'undefined') {
                                        localStorage.setItem('momentum_lang', e.target.value);
                                        window.location.reload();
                                    }
                                }}
                                defaultValue={typeof window !== 'undefined' ? localStorage.getItem('momentum_lang') || 'en' : 'en'}
                                className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी (Hindi)</option>
                                <option value="te">తెలుగు (Telugu)</option>
                                <option value="ta">தமிழ் (Tamil)</option>
                            </select>
                        </div>
                        <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <Moon className="h-5 w-5 text-indigo-500" />
                                <span className="font-medium">Dark Mode Default</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Sun className="h-5 w-5 text-orange-500" />
                                <span className="font-medium">Light Mode Preview</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Data & Account</h3>
                    <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
                        <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-secondary/50 transition-colors border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <Download className="h-5 w-5 text-emerald-500" />
                                <span className="font-medium">Export CSV Data</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-destructive/10 transition-colors border-b border-border/50 text-destructive"
                        >
                            <div className="flex items-center gap-3">
                                <LogOut className="h-5 w-5" />
                                <span className="font-medium">Log out</span>
                            </div>
                        </button>
                        <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-destructive/10 transition-colors text-destructive">
                            <div className="flex items-center gap-3">
                                <Trash2 className="h-5 w-5" />
                                <span className="font-medium">Delete Account</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-center pt-8 pb-4">
                <p className="text-xs text-muted-foreground font-medium">Momentum OS v1.0.0</p>
                <div className="mt-4 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                    <span className="opacity-70">Designed and Developed by</span>
                    <span className="font-bold text-primary tracking-widest uppercase">SARAN NERALLA</span>
                </div>
            </div>
        </div>
    );
}
