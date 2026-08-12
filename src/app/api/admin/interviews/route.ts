import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { listInterviews } from "@/lib/supabase/db";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const interviews = await listInterviews();

    const completed = interviews.filter((i) => i.status === "completed");
    const durations = completed
      .map((i) => i.durationSeconds)
      .filter((d): d is number => typeof d === "number" && d > 0);

    const stats = {
      total: interviews.length,
      completed: completed.length,
      averageDurationSeconds: durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null,
    };

    return NextResponse.json({ interviews, stats });
  } catch (err) {
    console.error("Admin list failed:", err);
    return NextResponse.json({ error: "Failed to load interviews" }, { status: 500 });
  }
}
