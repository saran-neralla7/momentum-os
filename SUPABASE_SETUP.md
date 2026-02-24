# Supabase Setup Guide for Momentum OS

Follow these steps exactly to set up your Supabase database and connect it to Momentum OS.

## 1. Create a Supabase Account
1. Go to [Supabase](https://supabase.com/).
2. Click **Start your project** and sign in (GitHub is recommended).

## 2. Create a New Project
1. Click **New Project**.
2. Select your Organization.
3. Name the project `Momentum OS`.
4. Generate a secure Database Password and save it securely (you'll need this if you use Prisma later, though we are using the direct client).
5. Choose a region closest to your users.
6. Click **Create new project**. Note: It might take a minute or two to provision the database.

## 3. Get API Keys
1. In the Supabase Dashboard, go to **Project Settings** (gear icon on the bottom left).
2. Click on **API** in the sidebar.
3. You will need two values:
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **Project API Keys -> anon / public** key

## 4. Set Environment Variables
1. At the root of your Momentum OS repository, create a `.env.local` file.
2. Add your keys replacing the placeholder values:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 5. Setup Database Tables & RLS Policies
1. In the Supabase Dashboard, go to the **SQL Editor** from the left sidebar.
2. Click **New query**.
3. Open the `supabase/schema.sql` file provided in this repository.
4. Copy all of the SQL text from `supabase/schema.sql` and paste it into the Supabase SQL Editor.
5. Click **Run** on the bottom right.
6. You will see a "Success" message indicating your tables, Row Level Security (RLS) policies, and performance indexes have been created.

*Why RLS?* Row Level Security ensures that even if someone gets your Anon API key, they can only view and edit their *own* habits and expenses via the UI.

## 6. Testing Connection
1. Run `npm run dev` in your local terminal.
2. Sign up via the Momentum OS auth page (Supabase handles Auth out of the box).
3. Check the **Authentication** tab in the Supabase Dashboard to verify your user was created successfully.
