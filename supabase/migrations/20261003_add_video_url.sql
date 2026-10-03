-- Run this in your Supabase SQL Editor to add the video_url column
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS video_url text;
