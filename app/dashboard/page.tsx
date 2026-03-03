import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const isAdmin = (session.user as any)?.role === "admin";

  // Redirect based on role
  if (isAdmin) {
    redirect("/dashboard/admin");
  } else {
    redirect("/dashboard/submissions");
  }
}
