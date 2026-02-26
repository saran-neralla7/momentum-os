-- 03_security_rls.sql
-- Strict Row Level Security policies for Location Data and Core Tables
-- Run this in the Supabase SQL Editor

-- 1. Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing potentially permissive policies on expenses (Optional safety cleanup)
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

-- 3. Create Strict Policies for Expenses (Protecting latitude/longitude PII)
CREATE POLICY "Strict View Own Expenses" 
ON expenses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Strict Insert Own Expenses" 
ON expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Strict Update Own Expenses" 
ON expenses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Strict Delete Own Expenses" 
ON expenses FOR DELETE 
USING (auth.uid() = user_id);

-- Note: The above ensures that even if someone finds the public anon key and mapbox token,
-- they CANNOT query the expenses table for arbitrary latitude/longitude coordinates 
-- unless they are explicitly authenticated as the user who created them.
