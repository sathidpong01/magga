import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

export async function GET(req: Request) {
  // Verify secret to prevent unauthorized calls
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Find rejected submissions older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldRejectedSubmissions = await prisma.mangaSubmission.findMany({
      where: {
        status: 'REJECTED',
        updatedAt: { lt: thirtyDaysAgo },
      }
    });

    if (oldRejectedSubmissions.length === 0) {
      return NextResponse.json({ message: "No submissions to clean up" });
    }

    let deletedCount = 0;
    let errorCount = 0;

    for (const submission of oldRejectedSubmissions) {
      try {
        // Extract file keys from URLs
        const fileUrls: string[] = [];
        if (submission.coverImage) fileUrls.push(submission.coverImage);
        
        try {
          const pages = JSON.parse(submission.pages as string);
          if (Array.isArray(pages)) fileUrls.push(...pages);
        } catch (e) {}

        // Delete files from R2
        for (const url of fileUrls) {
          if (!url.includes(R2_PUBLIC_URL || '')) continue;
          
          const key = url.replace(`${R2_PUBLIC_URL}/`, '');
          
          await S3.send(new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key
          }));
        }

        // Delete submission record
        await prisma.mangaSubmission.delete({
          where: { id: submission.id }
        });

        deletedCount++;
      } catch (err) {
        console.error(`Failed to cleanup submission ${submission.id}:`, err);
        errorCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      deleted: deletedCount, 
      errors: errorCount 
    });

  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
