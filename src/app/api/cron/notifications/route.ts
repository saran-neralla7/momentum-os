import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import webpush from 'web-push';

webpush.setVapidDetails(
    'mailto:saran.neralla@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export async function GET(req: Request) {
    try {
        // Optional: Secure this endpoint so only Vercel Cron can hit it
        const authHeader = req.headers.get('authorization');
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
            // Vercel cron uses a different header sometimes, but we can rely on standard Bearer if configured
            req.headers.get('x-vercel-cron') !== '1'
        ) {
            return new Response('Unauthorized', { status: 401 });
        }

        // 1. Find users who have subscriptions
        const { data: subs, error: subError } = await supabase.from('push_subscriptions').select('*');
        if (subError || !subs) return NextResponse.json({ error: 'Failed to fetch subs' }, { status: 500 });
        if (subs.length === 0) return NextResponse.json({ message: 'No subscriptions found' });

        const todayStr = new Date().toISOString().split('T')[0];
        let notificationsSent = 0;

        // Loop over subscriptions (in a real app, you'd batch this and optimize the DB query)
        for (const sub of subs) {
            const userId = sub.user_id;

            // Check if user has incomplete habits today
            const { data: userHabits } = await supabase.from('habits').select('id, title, frequency').eq('user_id', userId);

            if (userHabits && userHabits.length > 0) {
                const { data: completedLogs } = await supabase
                    .from('habit_logs')
                    .select('habit_id')
                    .eq('date', todayStr)
                    .eq('completed', true)
                    .in('habit_id', userHabits.map(h => h.id));

                const completedCount = completedLogs?.length || 0;

                // If they haven't completed all habits, remind them
                if (completedCount < userHabits.length) {
                    const payload = JSON.stringify({
                        title: 'Keep Your Momentum Check! ⏱️',
                        body: `You have ${userHabits.length - completedCount} habits left to crush today. Don't lose that streak!`,
                        icon: '/icon-192x192.png',
                        badge: '/icon-192x192.png'
                    });

                    const pushSub = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    };

                    try {
                        await webpush.sendNotification(pushSub, payload);
                        notificationsSent++;
                    } catch (e: any) {
                        // If endpoint expired or invalid, delete it
                        if (e.statusCode === 410 || e.statusCode === 404) {
                            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true, count: notificationsSent });

    } catch (error) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
