// Example in API Route or Server Component
import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { GetSession, SignInUser } from "./helper";

const secret = process.env.NEXTAUTH_SECRET || "";

export async function GET(req: NextRequest) {
  try {
    // Get the token from the cookie (or Authorization header)
    const user = await GetSession(req);
    if (user) {
      return NextResponse.json(user, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "You are not authenticated" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error checking session:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST method for signing
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const user = await SignInUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create a JWT manually
    const token = await encode({
      token: { user },
      secret
    });

    // Set cookie
    const response = NextResponse.json(user, { status: 200 });
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error("Error signing in user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
