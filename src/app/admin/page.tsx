import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await requireAdmin())) {
    redirect("/admin/login");
  }

  return <DashboardClient />;
}
