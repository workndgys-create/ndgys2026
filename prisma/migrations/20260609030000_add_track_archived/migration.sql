-- Add archived column to Track
ALTER TABLE "Track" ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false NOT NULL;
