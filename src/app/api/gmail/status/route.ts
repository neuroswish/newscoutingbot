import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const connection = await prisma.gmailConnection.findUnique({ where: { id: "local" } });
  return NextResponse.json({
    connected: Boolean(connection),
    email: connection?.email ?? null,
    scope: connection?.scope ?? null,
    updatedAt: connection?.updatedAt.toISOString() ?? null,
  });
}
