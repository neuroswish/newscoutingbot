import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, saveGmailConnection } from "@/lib/gmail";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("gmail_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/?gmail=failed", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code, request.url);
    await saveGmailConnection(tokens);
    const response = NextResponse.redirect(new URL("/?gmail=connected", request.url));
    response.cookies.delete("gmail_oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/?gmail=failed", request.url));
  }
}
