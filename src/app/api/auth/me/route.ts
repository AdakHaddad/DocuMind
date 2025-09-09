import { NextRequest, NextResponse } from "next/server";
import { GetSession } from "../session/helper";

export async function GET(req: NextRequest) {
  try {
    const user = await GetSession(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("/api/auth/me error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

