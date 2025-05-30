import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/src/lib/mongodb";
import { User } from "../[...nextauth]/route";

const secret = process.env.NEXTAUTH_SECRET || "";

export async function GetSession(req: NextRequest) {
  // Do not return as NextResponse
  try {
    // Get the token from the cookie (or Authorization header)
    const token = await getToken({ req, secret });

    if (token && token.user) {
      return token.user;
    } else {
      return null; // Not authenticated
    }
  } catch (error) {
    console.error("Error checking session:", error);
    return null; // Server error
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