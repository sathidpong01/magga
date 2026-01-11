import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

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
