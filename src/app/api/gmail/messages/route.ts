import { NextRequest, NextResponse } from "next/server";
import { fetchGmailMessagesForEmail } from "@/lib/gmail";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Choose a contact with an email address." }, { status: 400 });
  }

  try {
    const messages = await fetchGmailMessagesForEmail(email);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load Gmail messages." },
      { status: 400 }
    );
  }
}
