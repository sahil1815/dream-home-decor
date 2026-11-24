-- Migration: Add is_active column to workshop_settings
-- Allows administrators to turn the workshop system on or off from /admin/workshop
ALTER TABLE IF EXISTS workshop_settings 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
