-- Momentum OS Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Automatically create user profiles (if needed) but we will rely mostly on auth.users
-- HABITS TABLE
create table public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  frequency text not null check(frequency in ('daily', 'weekly', 'monthly')),
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- HABIT LOGS TABLE
create table public.habit_logs (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references public.habits(id) on delete cascade not null,
  date date not null,
  completed boolean default false not null,
  unique(habit_id, date)
);

-- EXPENSES TABLE
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  amount numeric(10, 2) not null,
  category text not null,
  description text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BUDGETS TABLE
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  category text not null,
  limit_amount numeric(10, 2) not null,
  unique(user_id, category)
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS for all tables
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;

-- Policies for Habits
create policy "Users can view their own habits" on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert their own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update their own habits" on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete their own habits" on public.habits for delete using (auth.uid() = user_id);

-- Policies for Habit Logs
-- Note: Habit logs don't have user_id directly, we check through habits table
create policy "Users can view their own habit logs" on public.habit_logs for select using (
  exists (select 1 from public.habits where id = habit_logs.habit_id and user_id = auth.uid())
);
create policy "Users can insert their own habit logs" on public.habit_logs for insert with check (
  exists (select 1 from public.habits where id = habit_logs.habit_id and user_id = auth.uid())
);
create policy "Users can update their own habit logs" on public.habit_logs for update using (
  exists (select 1 from public.habits where id = habit_logs.habit_id and user_id = auth.uid())
);
create policy "Users can delete their own habit logs" on public.habit_logs for delete using (
  exists (select 1 from public.habits where id = habit_logs.habit_id and user_id = auth.uid())
);

-- Policies for Expenses
create policy "Users can view their own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Users can insert their own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users can update their own expenses" on public.expenses for update using (auth.uid() = user_id);
create policy "Users can delete their own expenses" on public.expenses for delete using (auth.uid() = user_id);

-- Policies for Budgets
create policy "Users can view their own budgets" on public.budgets for select using (auth.uid() = user_id);
create policy "Users can insert their own budgets" on public.budgets for insert with check (auth.uid() = user_id);
create policy "Users can update their own budgets" on public.budgets for update using (auth.uid() = user_id);
create policy "Users can delete their own budgets" on public.budgets for delete using (auth.uid() = user_id);

-- INDEXES FOR PERFORMANCE
create index idx_habits_user on public.habits(user_id);
create index idx_habit_logs_habit on public.habit_logs(habit_id);
create index idx_expenses_user on public.expenses(user_id);
create index idx_budgets_user on public.budgets(user_id);
