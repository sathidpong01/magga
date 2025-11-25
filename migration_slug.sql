-- Add slug column
ALTER TABLE "Manga" ADD COLUMN "slug" TEXT;

-- Backfill existing data with ID as slug (to ensure uniqueness initially)
UPDATE "Manga" SET "slug" = "id";

-- Create unique index
CREATE UNIQUE INDEX "Manga_slug_key" ON "Manga"("slug");
