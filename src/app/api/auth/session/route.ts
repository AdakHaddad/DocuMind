// Example in API Route or Server Component
import { User } from "@/src/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import bcrypt from "bcryptjs";
import { encode, getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET || "";

export async function GET(req: NextRequest) {
  try {
    // Get the token from the cookie (or Authorization header)
    const token = await getToken({ req, secret });

    if (token && token.user) {
      return NextResponse.json(token.user, { status: 200 });
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

export async function SignInUser(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Check if user exists (sign in)
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      // User exists, check password for sign-in
      const passwordMatch = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (passwordMatch) {
        // User authenticated successfully, return user data
        return {
          id: existingUser._id.toString(),
          email: existingUser.email,
          username: existingUser.username,
          slug: existingUser.slug
        };
      } else {
        return null; // Invalid password
      }
    }

    return null; // User doesn't exist
  } catch (error) {
    console.error("Error signing in user:", error);
    return null;
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
