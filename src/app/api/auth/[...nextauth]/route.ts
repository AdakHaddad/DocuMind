import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/src/lib/mongodb";
import bcrypt from "bcryptjs"; // To hash passwords for better security

interface User {
  id: string;
  username?: string | null;
  email?: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // First, check if the user exists and authenticate
        const user = await signInOrSignUpUser(
          credentials.email,
          credentials.password
        );

        if (user) {
          return user;
        }

        // If no user is found or password doesn't match, return null
        return null;
      }
    })
  ],
  pages: {
    signIn: "/signin"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as User;
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

async function signInOrSignUpUser(
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
          username: existingUser.username
        };
      } else {
        // Password doesn't match
        return null;
      }
    }

    // If user doesn't exist, return null (no sign-up on login)
    return null;
  } catch (error) {
    console.error("Error signing in or signing up user:", error);
    return null;
  }
}
