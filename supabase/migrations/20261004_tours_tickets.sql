-- Run this in your Supabase SQL Editor
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS locations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tickets jsonb DEFAULT '[]'::jsonb;

-- Example payload for locations: ["New York, NY", "London, UK"]
-- Example payload for tickets: [{"name": "Day 1 Pass", "price": 50}, {"name": "VIP Access", "price": 150}]
