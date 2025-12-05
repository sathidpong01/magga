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
  // Verify secret to prevent unauthorized calls (supports both query param and header)
  const { searchParams } = new URL(req.url);
  const secretParam = searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const secretHeader = authHeader?.replace("Bearer ", "");
  
  if (secretParam !== process.env.CRON_SECRET && secretHeader !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = {
      rateLimitsDeleted: 0,
      submissionsDeleted: 0,
      submissionErrors: 0,
    };

    // 1. Clean up expired rate limit records (LoginAttempt)
    try {
      const { count } = await prisma.loginAttempt.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      results.rateLimitsDeleted = count;
      console.log(`[Cron Cleanup] Deleted ${count} expired rate limit records`);
    } catch (err) {
      console.error("[Cron Cleanup] Rate limit cleanup failed:", err);
    }

    // 2. Find rejected submissions older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldRejectedSubmissions = await prisma.mangaSubmission.findMany({
      where: {
        status: 'REJECTED',
        updatedAt: { lt: thirtyDaysAgo },
      }
    });

    if (oldRejectedSubmissions.length > 0) {
      for (const submission of oldRejectedSubmissions) {
        try {
          // Extract file keys from URLs
          const fileUrls: string[] = [];
          if (submission.coverImage) fileUrls.push(submission.coverImage);
          
          try {
            const pages = JSON.parse(submission.pages as string);
            if (Array.isArray(pages)) fileUrls.push(...pages);
          } catch {}

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

          results.submissionsDeleted++;
        } catch (err) {
          console.error(`Failed to cleanup submission ${submission.id}:`, err);
          results.submissionErrors++;
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    });

  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
