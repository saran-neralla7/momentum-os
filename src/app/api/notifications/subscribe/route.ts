import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import webpush from 'web-push';

// Configuration for web-push
webpush.setVapidDetails(
    'mailto:saran.neralla@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(req: Request) {
    try {
        const { subscription, userId } = await req.json();

        if (!subscription || !subscription.endpoint || !userId) {
            return NextResponse.json({ error: 'Invalid subscription or missing userId' }, { status: 400 });
        }

        // Check if the subscription already exists to avoid duplicates
        const { data: existingSub } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('endpoint', subscription.endpoint)
            .single();

        if (existingSub) {
            return NextResponse.json({ success: true, message: 'Subscription already exists' }, { status: 200 });
        }

        // Insert new subscription
        const { error } = await supabase.from('push_subscriptions').insert({
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
        });

        if (error) {
            console.error('Supabase Insert Error:', error);
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
        }

        // Send a welcome notification to test it
        const payload = JSON.stringify({
            title: 'Welcome to Momentum OS! 🚀',
            body: 'Push notifications are now active. We will remind you about your tasks and habits.',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png'
        });

        await webpush.sendNotification(subscription, payload);

        return NextResponse.json({ success: true, message: 'Subscribed successfully' }, { status: 201 });
    } catch (error) {
        console.error('Subscription Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
