import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/gmail";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const state = crypto.randomUUID();
    const url = buildGoogleAuthUrl(request.url, state);
    const response = NextResponse.redirect(url);
    response.cookies.set("gmail_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start Gmail connection." },
      { status: 400 }
    );
  }
}
