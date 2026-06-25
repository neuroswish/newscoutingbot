import type { Contact } from "@prisma/client";

export type ContactView = {
  id: string;
  name: string;
  company: string | null;
  title: string | null;
  emails: string[];
  phone: string | null;
  region: string | null;
  department: string | null;
  priority: string | null;
  status: string | null;
  source: string | null;
  sourceUrls: string | null;
  notes: string | null;
  confidence: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ParsedContactInput = {
  name: string;
  company?: string;
  title?: string;
  emails: string[];
  phone?: string;
  region?: string;
  department?: string;
  priority?: string;
  status?: string;
  source?: string;
  sourceUrls?: string;
  notes?: string;
  confidence?: string;
  raw?: Record<string, string>;
};

export function parseEmailsJson(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function serializeContact(contact: Contact): ContactView {
  return {
    id: contact.id,
    name: contact.name,
    company: contact.company,
    title: contact.title,
    emails: parseEmailsJson(contact.emailsJson),
    phone: contact.phone,
    region: contact.region,
    department: contact.department,
    priority: contact.priority,
    status: contact.status,
    source: contact.source,
    sourceUrls: contact.sourceUrls,
    notes: contact.notes,
    confidence: contact.confidence,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeText(value: unknown): string {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}
