import { NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (typeof password !== "string" || password.length === 0) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const expected = process.env.ADMIN_PASSWORD;
    if (!expected || password !== expected) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
