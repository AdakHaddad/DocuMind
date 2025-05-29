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

    // Slugify username
    let slugifiedUsername = username
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let existingSlug = true;
    while (existingSlug) {
      // Find if slugifiedUsername already exists
      const userWithSlug = await usersCollection.findOne({
        slug: slugifiedUsername
      });

      if (!userWithSlug) {
        existingSlug = false; // Slug is unique, exit loop
      } else {
        // Cut off the last part of the slug if it exists
        slugifiedUsername = slugifiedUsername.replace(/-\d+$/, "");

        // If slug exists, append a number to make it unique
        const randomSuffix = Math.floor(Math.random() * 1000);
        slugifiedUsername = `${slugifiedUsername}-${randomSuffix}`;
      }
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      username,
      slug: slugifiedUsername
    };

    // Insert the new user into the database
    const result = await usersCollection.insertOne(newUser);

    // Respond with success
    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        email: newUser.email,
        username: newUser.username,
        slug: newUser.slug
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error signing up user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
