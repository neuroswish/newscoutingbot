import { NextResponse } from "next/server";
import { normalizeEmail, normalizeText, serializeContact, type ParsedContactInput } from "@/lib/contacts";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ImportRequest = {
  fileName?: string;
  totalRows?: number;
  contacts?: ParsedContactInput[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as ImportRequest;
  const contacts = Array.isArray(body.contacts) ? body.contacts : [];

  if (!contacts.length) {
    return NextResponse.json({ error: "No parsed contacts were provided." }, { status: 400 });
  }

  const batch = await prisma.importBatch.create({
    data: {
      fileName: body.fileName || "uploaded contacts",
      totalRows: body.totalRows ?? contacts.length,
      status: "importing",
    },
  });

  let importedCount = 0;
  let skippedCount = 0;

  for (const contact of contacts) {
    const name = normalizeText(contact.name);
    if (!name) {
      skippedCount += 1;
      continue;
    }

    const emails = Array.from(new Set((contact.emails ?? []).map(normalizeEmail).filter(Boolean)));
    const existing = await findExistingContact(name, normalizeText(contact.company), emails);
    const data = {
      name,
      company: optionalText(contact.company),
      title: optionalText(contact.title),
      emailsJson: JSON.stringify(emails),
      phone: optionalText(contact.phone),
      region: optionalText(contact.region),
      department: optionalText(contact.department),
      priority: optionalText(contact.priority),
      status: optionalText(contact.status),
      source: optionalText(contact.source),
      sourceUrls: optionalText(contact.sourceUrls),
      notes: optionalText(contact.notes),
      confidence: optionalText(contact.confidence),
      rawJson: JSON.stringify(contact.raw ?? {}),
      importBatchId: batch.id,
    };

    if (existing) {
      await prisma.contact.update({ where: { id: existing.id }, data });
    } else {
      await prisma.contact.create({ data });
    }
    importedCount += 1;
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: { importedCount, skippedCount, status: "completed" },
  });

  const allContacts = await prisma.contact.findMany({
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    batchId: batch.id,
    importedCount,
    skippedCount,
    contacts: allContacts.map(serializeContact),
  });
}

async function findExistingContact(name: string, company: string, emails: string[]) {
  for (const email of emails) {
    const byEmail = await prisma.contact.findFirst({
      where: { emailsJson: { contains: email } },
    });
    if (byEmail) return byEmail;
  }

  return prisma.contact.findFirst({
    where: {
      name,
      company: company || null,
    },
  });
}

function optionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}
