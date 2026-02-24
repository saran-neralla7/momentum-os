# Vercel Deployment Guide for Momentum OS

Deploying Momentum OS to Vercel is highly optimized because Next.js and Vercel are created by the same team. This app is guaranteed to work on the free **Vercel Hobby plan**.

## 1. GitHub Setup
1. Initialize your repository if you haven't already:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Momentum OS"
   ```
2. Go to [GitHub](https://github.com/) and create a new repository (e.g., `momentum-os`).
3. Follow the instructions to push your code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/your-username/momentum-os.git
   git push -u origin main
   ```

## 2. Connect to Vercel
1. Go to [Vercel](https://vercel.com/) and sign up or log in with GitHub.
2. Click **Add New...** -> **Project**.
3. Find your `momentum-os` repository in the list and click **Import**.

## 3. Configuration & Environment Variables
1. Give your project a name (default is fine).
2. Leave the "Framework Preset" as Next.js.
3. Open the **Environment Variables** section. Add the variables from your local `.env.local`:
   - Name: `NEXT_PUBLIC_SUPABASE_URL` | Value: *Your URL*
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Value: *Your Anon Key*
4. Click **Deploy**.

## 4. Build Settings & Production Test
- Vercel will now install dependencies (`npm install`) and build the app (`npm run build`). it usually takes ~2 minutes.
- Once complete, you will see a preview screen. Click the preview or "Continue to Dashboard".
- Visit the live domain provided by Vercel. Test the login flow, animations, and PWA installability (look for the "Install App" button in your browser URL bar).

## 5. Fixing Common Errors
- *Database Fetch Fails*: Double-check your environment variables in Vercel settings -> Environment Variables. Did you forget to add the Supabase keys? Note that you must trigger a redeploy if you edit vars later.
- *PWA Service Worker Error*: Ensure your deployment runs on HTTPS (Vercel provides this out of the box) because service workers only operate on secure networks.

## 6. How to Upgrade Later
The Hobby plan is highly generous, allowing for roughly 100GB of bandwidth and plenty of serverless function executions. If the app goes viral:
- You will be notified by Vercel near bandwidth limits.
- Upgrade to Vercel Pro ($20/mo) without changing any code.
- Similarly, Supabase allows an easy click-to-upgrade to the Pro plan ($25/mo) if you surpass 50,000 monthly active users.
