import Dashboard from "@/components/Dashboard";
import { todayYmd } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { listTasks } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const tasks = await listTasks();

  return <Dashboard user={user} initialTasks={tasks} today={todayYmd()} />;
}
