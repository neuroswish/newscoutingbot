import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const connection = await prisma.gmailConnection.findUnique({ where: { id: "local" } });
    return NextResponse.json({
      connected: Boolean(connection),
      email: connection?.email ?? null,
      scope: connection?.scope ?? null,
      updatedAt: connection?.updatedAt.toISOString() ?? null,
    });
  } catch (error) {
    console.warn("Could not load Gmail connection status.", error);
    return NextResponse.json({
      connected: false,
      email: null,
      scope: null,
      updatedAt: null,
    });
  }
}
