import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const isAdmin = session.user?.role === "ADMIN";

  // Redirect based on role
  if (isAdmin) {
    redirect("/dashboard/admin");
  } else {
    redirect("/dashboard/submissions");
  }
}
