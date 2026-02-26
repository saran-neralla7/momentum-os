-- Migration for Round 7 Premium Features

-- Create Profiles Table for Streak Freezes
create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  freezes_available integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;

-- Drop existing policies if they exist to avoid duplication errors
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, freezes_available)
  values (new.id, 0);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert profile for existing users to prevent app crashes when querying freezes
insert into public.profiles (id, freezes_available)
select id, 0 from auth.users
on conflict (id) do nothing;

-- Update Habits table for Specific Day Routines
alter table public.habits drop constraint if exists habits_frequency_check;
alter table public.habits alter column frequency type jsonb using '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]'::jsonb;
