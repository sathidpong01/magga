import { requireAdminPage } from "@/lib/auth-helpers";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return children;
}
