// Example: Server Component fetching data with proper typing and error handling
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import MangaDetail from "@/app/components/features/MangaDetail";
import MangaDetailSkeleton from "@/app/components/ui/MangaDetailSkeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  const manga = await db.query.manga.findFirst({
    where: eq(mangaTable.id, id),
    columns: {
      title: true,
      description: true,
      coverImage: true,
    },
  });

  if (!manga) {
    return {
      title: "Manga Not Found",
    };
  }

  return {
    title: manga.title,
    description: manga.description,
    openGraph: {
      title: manga.title,
      description: manga.description,
      images: [manga.coverImage].filter(Boolean),
    },
  };
}

// Main page component
export default async function MangaPage({ params }: PageProps) {
  const { id } = await params;

  const manga = await db.query.manga.findFirst({
    where: eq(mangaTable.id, id),
    with: {
      category: true,
      mangaTags_mangaId: {
        with: { tag_tagId: true },
      },
      author: true, // Example
    },
  });

  if (!manga) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<MangaDetailSkeleton />}>
        {/* Pass manga and tags in proper format */}
        <MangaDetail manga={{ ...manga, tags: manga.mangaTags_mangaId?.map((mt: any) => mt.tag_tagId) || [] }} />
      </Suspense>
    </div>
  );
}

// Generate static params for static generation (optional)
export async function generateStaticParams() {
  const manga = await db.query.manga.findMany({
    columns: { id: true },
    limit: 100, // Limit for initial build
    orderBy: [desc(mangaTable.createdAt)],
  });

  return manga.map((m) => ({
    id: m.id,
  }));
}

// Revalidate every hour
export const revalidate = 3600;
