-- Complete Migration Script for Turso
-- Run these commands one at a time on Turso console

-- =====================================================
-- STEP 1: Add missing columns to Manga table
-- =====================================================

-- Add coverWidth and coverHeight (if missing)
ALTER TABLE "Manga" ADD COLUMN "coverWidth" INTEGER;
ALTER TABLE "Manga" ADD COLUMN "coverHeight" INTEGER;

-- Add authorId (new for Author relation)
ALTER TABLE "Manga" ADD COLUMN "authorId" TEXT;

-- =====================================================
-- STEP 2: Add missing columns to MangaSubmission table
-- =====================================================

ALTER TABLE "MangaSubmission" ADD COLUMN "authorId" TEXT;

-- =====================================================
-- STEP 3: Create Author table
-- =====================================================

CREATE TABLE IF NOT EXISTS "Author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "profileUrl" TEXT,
    "iconUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on Author name
CREATE UNIQUE INDEX IF NOT EXISTS "Author_name_key" ON "Author"("name");

-- =====================================================
-- STEP 4: Create indexes for optimization
-- =====================================================

CREATE INDEX IF NOT EXISTS "Manga_authorId_idx" ON "Manga"("authorId");

-- =====================================================
-- STEP 5: Add socialLinks column to Author
-- =====================================================

ALTER TABLE "Author" ADD COLUMN "socialLinks" TEXT;

-- =====================================================
-- NOTE: Run commands ONE BY ONE - SQLite will error on 
-- duplicate column names, just skip those commands.
-- =====================================================
