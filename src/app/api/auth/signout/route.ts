import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Signed out" },
    { status: 200 }
  );

  // Clear the session token cookie (for both JWT and database strategy)
  response.cookies.set("next-auth.session-token", "", {
    path: "/",
    expires: new Date(0)
  });

  response.cookies.set("next-auth.callback-url", "", {
    path: "/",
    expires: new Date(0)
  });

  return response;
}
