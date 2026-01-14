// Example: Server Component fetching data with proper typing and error handling
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MangaDetail from "@/app/components/features/MangaDetail";
import MangaDetailSkeleton from "@/app/components/ui/MangaDetailSkeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  const manga = await prisma.manga.findUnique({
    where: { id },
    select: {
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

  const manga = await prisma.manga.findUnique({
    where: { id },
    include: {
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!manga) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<MangaDetailSkeleton />}>
        <MangaDetail manga={manga} />
      </Suspense>
    </div>
  );
}

// Generate static params for static generation (optional)
export async function generateStaticParams() {
  const manga = await prisma.manga.findMany({
    select: { id: true },
    take: 100, // Limit for initial build
  });

  return manga.map((m) => ({
    id: m.id,
  }));
}

// Revalidate every hour
export const revalidate = 3600;
