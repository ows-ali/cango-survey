import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { getInterviewWithMessages } from "@/lib/supabase/db";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const interview = await getInterviewWithMessages(id);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }
    return NextResponse.json({ interview });
  } catch (err) {
    console.error("Admin detail failed:", err);
    return NextResponse.json({ error: "Failed to load interview" }, { status: 500 });
  }
}
