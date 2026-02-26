-- Add location tracking to expenses for the generic spending map feature
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;
