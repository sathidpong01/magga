import { db } from "./db";
import { manga as mangaTable } from "./db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    console.log("Testing query for slug 'transfurmation'...");
    const mangaData = await db.query.manga.findFirst({
      where: eq(mangaTable.slug, "transfurmation"),
      columns: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverImage: true,
        pages: true,
        authorName: true,
        viewCount: true,
        averageRating: true,
        ratingCount: true,
      },
      with: {
        author: {
          columns: { id: true, name: true, socialLinks: true },
        },
        category: true,
        mangaTags_mangaId: {
          with: { tag_tagId: true },
        },
      },
    });
    
    console.log("Query Successful!");
    console.log("mangaData id:", mangaData?.id);
  } catch (err) {
    console.error("Query Failed:", err);
  }
}

main().catch(console.error);
