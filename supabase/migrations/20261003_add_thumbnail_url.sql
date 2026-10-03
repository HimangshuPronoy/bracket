-- Run this in your Supabase SQL Editor to add the thumbnail_url column
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS thumbnail_url text;
