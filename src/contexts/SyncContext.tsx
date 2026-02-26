'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { get, set } from 'idb-keyval';
import { supabase } from '@/lib/supabase';
import { hapticFeedback } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SyncAction = {
    id: string;
    table: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    payload: any;
    timestamp: number;
};

interface SyncContextType {
    isOnline: boolean;
    pendingCount: number;
    queueAction: (table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
    isOnline: true,
    pendingCount: 0,
    queueAction: async () => { },
});

export const useSync = () => useContext(SyncContext);

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingActions, setPendingActions] = useState<SyncAction[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initial online status check
    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            hapticFeedback.light();
            processQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
            hapticFeedback.medium();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        loadQueue();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const loadQueue = async () => {
        try {
            const queue = await get<SyncAction[]>('momentum_sync_queue') || [];
            setPendingActions(queue);
            if (navigator.onLine && queue.length > 0) {
                processQueue();
            }
        } catch (e) {
            console.error("Failed to load sync queue from IDB", e);
        }
    };

    const saveQueue = async (queue: SyncAction[]) => {
        setPendingActions(queue);
        await set('momentum_sync_queue', queue);
    };

    const queueAction = async (table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
        if (isOnline) {
            // Direct execute if online
            try {
                if (action === 'INSERT') {
                    await supabase.from(table).insert([payload]);
                } else if (action === 'UPDATE') {
                    await supabase.from(table).update(payload).eq('id', payload.id);
                } else if (action === 'DELETE') {
                    await supabase.from(table).delete().eq('id', payload.id);
                }
                return;
            } catch (e) {
                console.warn(`Direct execution failed, queuing offline action.`, e);
            }
        }

        // Queue for offline
        const newAction: SyncAction = {
            id: Math.random().toString(36).substring(7),
            table,
            action,
            payload,
            timestamp: Date.now()
        };
        await saveQueue([...pendingActions, newAction]);
    };

    const processQueue = async () => {
        if (isSyncing || pendingActions.length === 0 || !navigator.onLine) return;

        setIsSyncing(true);
        const currentQueue = await get<SyncAction[]>('momentum_sync_queue') || [];
        const failedActions: SyncAction[] = [];

        for (const action of currentQueue) {
            try {
                if (action.action === 'INSERT') {
                    await supabase.from(action.table).insert([action.payload]);
                } else if (action.action === 'UPDATE') {
                    await supabase.from(action.table).update(action.payload).eq('id', action.payload.id);
                } else if (action.action === 'DELETE') {
                    await supabase.from(action.table).delete().eq('id', action.payload.id);
                }
            } catch (error) {
                console.error(`Failed to sync action: ${action.id}`, error);
                failedActions.push(action);
            }
        }

        await saveQueue(failedActions);
        setIsSyncing(false);
    };

    return (
        <SyncContext.Provider value={{ isOnline, pendingCount: pendingActions.length, queueAction }}>
            {children}
            {/* Sync Indicator */}
            <AnimatePresence>
                {(!isOnline || pendingActions.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-safe left-1/2 -translate-x-1/2 z-[100] mt-2 bg-secondary/80 backdrop-blur-md px-4 py-2 rounded-full border border-border/50 shadow-lg flex items-center gap-2 text-xs font-medium pointer-events-none"
                    >
                        {isOnline ? (
                            <>
                                <Wifi className="h-4 w-4 text-green-500 animate-pulse" />
                                <span>Syncing {pendingActions.length} changes...</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="h-4 w-4 text-destructive" />
                                <span>Offline ({pendingActions.length} pending)</span>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </SyncContext.Provider>
    );
}
