import { NextResponse } from "next/server";
import { serializeContact } from "@/lib/contacts";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const contacts = await prisma.contact
    .findMany({
      orderBy: [{ company: "asc" }, { name: "asc" }],
    })
    .catch((error) => {
      console.error("Unable to load contacts.", error);
      return [];
    });

  return NextResponse.json({ contacts: contacts.map(serializeContact) });
}
