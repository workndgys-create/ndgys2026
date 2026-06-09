-- Add archived column to Portfolio
ALTER TABLE "Portfolio" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
