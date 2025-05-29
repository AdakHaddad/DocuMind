// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server"; // Use NextRequest and NextResponse

import { connectToDatabase } from "@/src/lib/mongodb"; // Modify based on your db connection function
import bcrypt from "bcryptjs";

// POST method for sign-up
export async function POST(req: NextRequest) {
  const { email, password, username } = await req.json();

  if (!email || !password || !username) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Check if the user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      username
    };

    // Insert the new user into the database
    const result = await usersCollection.insertOne(newUser);

    // Respond with success
    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        email: newUser.email,
        username: newUser.username
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error signing up user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
