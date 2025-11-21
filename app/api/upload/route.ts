import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const files = form.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const saved: string[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const safeName = `${Date.now()}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`;

      await S3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: safeName,
          Body: buffer,
          ContentType: file.type,
        })
      );

      // Use provided public URL or construct one (though R2 usually needs a custom domain or worker for public access)
      // If R2_PUBLIC_URL is set (e.g. https://pub-xxx.r2.dev), use it.
      // Otherwise, we might return just the key or a presumed URL.
      const url = R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}/${safeName}`
        : `/uploads/${safeName}`; // Fallback if they are proxying or something, but ideally R2_PUBLIC_URL is set.

      saved.push(url);
    }

    return NextResponse.json({ urls: saved });
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
