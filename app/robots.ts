import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/auth"],
    },
    sitemap: `${process.env.NEXTAUTH_URL}/sitemap.xml`,
  };
}
