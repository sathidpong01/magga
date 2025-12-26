import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://magga.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/submit/",
        "/settings/",
        "/dashboard/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
