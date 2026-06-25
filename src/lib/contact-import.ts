import * as XLSX from "xlsx";
import { normalizeEmail, normalizeText, type ParsedContactInput } from "./contacts";

type SheetMatrix = string[][];

export type ImportPreview = {
  fileName: string;
  sheetName: string;
  headerRowIndex: number;
  totalRows: number;
  skippedRows: number;
  contacts: ParsedContactInput[];
  headers: string[];
};

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g;

const FIELD_ALIASES: Record<keyof Omit<ParsedContactInput, "raw" | "emails"> | "email", string[]> = {
  name: ["name", "full name", "contact", "person", "lead"],
  company: ["company", "organization", "brand", "agency", "account", "client"],
  title: ["job title", "title", "role", "position"],
  email: ["email", "emails", "email info", "published contact info", "potential email(s)", "contact info"],
  phone: ["phone", "mobile", "telephone", "published contact info", "contact info"],
  region: ["region", "region / base", "location", "base", "market"],
  department: ["department", "dept", "category"],
  priority: ["priority", "tier"],
  status: ["status", "current status"],
  source: ["source", "source channel", "route", "contact route"],
  sourceUrls: ["source url(s)", "source url", "url", "urls", "links"],
  notes: ["notes", "evidence / notes", "evidence", "description"],
  confidence: ["confidence", "email confidence"],
};

export function parseContactsWorkbook(buffer: Buffer, fileName: string): ImportPreview {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error("No readable worksheet was found.");
  }

  const matrix = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  const rows = normalizeMatrix(matrix);
  const headerRowIndex = findHeaderRow(rows);
  const headers = rows[headerRowIndex] ?? [];
  const dataRows = rows.slice(headerRowIndex + 1);
  const contacts = dataRows
    .map((row) => parseContactRow(headers, row))
    .filter((contact): contact is ParsedContactInput => Boolean(contact));

  return {
    fileName,
    sheetName,
    headerRowIndex,
    totalRows: dataRows.filter((row) => row.some(Boolean)).length,
    skippedRows: Math.max(0, dataRows.filter((row) => row.some(Boolean)).length - contacts.length),
    contacts,
    headers,
  };
}

function normalizeMatrix(matrix: unknown[][]): SheetMatrix {
  return matrix
    .map((row) => row.map(normalizeText))
    .filter((row) => row.some(Boolean));
}

function findHeaderRow(rows: SheetMatrix): number {
  let bestIndex = 0;
  let bestScore = -1;

  rows.forEach((row, index) => {
    const score = row.reduce((sum, cell) => sum + headerCellScore(cell), 0);
    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  });

  return bestIndex;
}

function headerCellScore(cell: string): number {
  const normalized = normalizeHeader(cell);
  if (!normalized) return 0;
  const allAliases = Object.values(FIELD_ALIASES).flat();
  if (allAliases.includes(normalized)) return 4;
  if (allAliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) return 2;
  return 0;
}

function parseContactRow(headers: string[], row: string[]): ParsedContactInput | null {
  const raw = Object.fromEntries(
    headers.map((header, index) => [header || `Column ${index + 1}`, normalizeText(row[index])])
  );
  const get = (field: keyof typeof FIELD_ALIASES) => getField(headers, row, field);
  const combinedRowText = row.join(" ");
  const name = get("name");

  if (!name || looksLikeSummaryRow(name)) {
    return null;
  }

  const emailText = [get("email"), combinedRowText].filter(Boolean).join(" ");
  const emails = uniqueValues(extractEmails(emailText).map(normalizeEmail));
  const phone = firstMatch(get("phone"), PHONE_PATTERN);

  return {
    name,
    company: get("company"),
    title: get("title"),
    emails,
    phone,
    region: get("region"),
    department: get("department"),
    priority: get("priority"),
    status: get("status"),
    source: get("source"),
    sourceUrls: get("sourceUrls"),
    notes: get("notes"),
    confidence: get("confidence"),
    raw,
  };
}

function getField(headers: string[], row: string[], field: keyof typeof FIELD_ALIASES): string {
  const aliases = FIELD_ALIASES[field];
  const exactIndex = headers.findIndex((header) => aliases.includes(normalizeHeader(header)));
  if (exactIndex >= 0) return normalizeText(row[exactIndex]);

  const fuzzyIndex = headers.findIndex((header) => {
    const normalized = normalizeHeader(header);
    return aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized));
  });
  return fuzzyIndex >= 0 ? normalizeText(row[fuzzyIndex]) : "";
}

function normalizeHeader(value: string): string {
  return normalizeText(value).toLowerCase();
}

function extractEmails(value: string): string[] {
  return value.match(EMAIL_PATTERN) ?? [];
}

function firstMatch(value: string, pattern: RegExp): string {
  const match = value.match(pattern);
  return match?.[0] ? normalizeText(match[0]) : "";
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function looksLikeSummaryRow(value: string): boolean {
  const lowered = value.toLowerCase();
  return lowered.startsWith("total ") || lowered.includes("named people only");
}
