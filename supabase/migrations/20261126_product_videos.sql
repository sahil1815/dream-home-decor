-- Migration: Add video_urls column to products table
-- Stores Facebook video / Reel links shared by the owner so customers can watch product videos on the product page.
ALTER TABLE IF EXISTS products
ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}'::TEXT[];
