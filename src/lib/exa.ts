import type { LeadResult, LeadSource } from "./leads";

type ExaResult = {
  title?: string;
  url?: string;
  highlights?: string[];
};

type ExaCitation = {
  title?: string;
  url?: string;
};

type ExaGrounding = {
  field?: string;
  citations?: ExaCitation[];
};

type ExaLeadOutput = {
  name?: unknown;
  company?: unknown;
  title?: unknown;
  email?: unknown;
  phone?: unknown;
  linkedin_url?: unknown;
  notes?: unknown;
};

type ExaResponse = {
  results?: ExaResult[];
  output?: {
    content?: {
      leads?: ExaLeadOutput[];
    };
    grounding?: ExaGrounding[];
  };
};

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const LINKEDIN_PROFILE = /linkedin\.com\/in\//i;

export async function findLeadsWithExa(company: string, jobTitle: string): Promise<LeadResult[]> {
  const apiKey = process.env.EXA_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Add an EXA_API_KEY in .env to run lead research.");
  }

  const profileSearch = await searchExa(apiKey, {
    query: `${jobTitle} at ${company}`,
    type: "auto",
    category: "people",
    userLocation: "US",
    numResults: 8,
    contents: { highlights: true },
  });

  const publicContactSearch = await searchExa(apiKey, {
    query:
      `Publicly published work email addresses and contact details for "${jobTitle}" contacts at "${company}". ` +
      "Prioritize official press releases, press contact blocks, company directories, and industry directories.",
    type: "auto",
    userLocation: "US",
    numResults: 8,
    contents: { highlights: true },
  });

  const candidateContext = (profileSearch.results ?? [])
    .slice(0, 8)
    .map((result) => `${safeString(result.title)} - ${safeString(result.url)}`)
    .join("\n");
  const publicContactContext = (publicContactSearch.results ?? [])
    .slice(0, 8)
    .map(
      (result) =>
        `${safeString(result.title)} - ${safeString(result.url)}\n${(result.highlights ?? []).join(" ")}`
    )
    .join("\n\n");

  const enrichedSearch = await searchExa(apiKey, {
    query:
      `Find public professional contact details for people currently working at "${company}" ` +
      `whose title matches "${jobTitle}" or a close equivalent. ` +
      "Prioritize publicly posted work email addresses and phone numbers. " +
      "Search public company pages, press releases, portfolio pages, directories, and professional profile pages. " +
      `Candidate profile results to verify:\n${candidateContext}\n\n` +
      `Public contact-source results to verify and prioritize:\n${publicContactContext}`,
    type: "deep-lite",
    additionalQueries: [
      `"${company}" "${jobTitle}" email contact`,
      `"${company}" "${jobTitle}" LinkedIn`,
    ],
    numResults: 10,
    systemPrompt:
      `Return only named people whose sources explicitly identify them as currently working at "${company}" in the requested role or a close equivalent. ` +
      "Do not include external collaborators, vendors, agencies, or people merely associated with campaigns unless they hold the requested role at the requested company. " +
      "Never guess, infer, or construct an email address or phone number. Leave contact fields empty when not explicitly published. Prefer current role evidence and avoid duplicates.",
    outputSchema: {
      type: "object",
      required: ["leads"],
      properties: {
        leads: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "company", "title", "email", "phone", "linkedin_url", "notes"],
            properties: {
              name: { type: "string" },
              company: { type: "string" },
              title: { type: "string" },
              email: {
                type: "string",
                description: "Explicitly published professional email address, or an empty string.",
              },
              phone: {
                type: "string",
                description: "Explicitly published professional phone number, or an empty string.",
              },
              linkedin_url: {
                type: "string",
                description: "Matching public LinkedIn profile URL, or an empty string.",
              },
              notes: { type: "string" },
            },
          },
        },
      },
    },
  });

  return normalizeLeadResults(company, jobTitle, profileSearch, enrichedSearch, publicContactSearch);
}

export function normalizeLeadResults(
  company: string,
  jobTitle: string,
  profileSearch: ExaResponse,
  enrichedSearch: ExaResponse,
  publicContactSearch: ExaResponse = {}
): LeadResult[] {
  const structuredLeads = enrichedSearch.output?.content?.leads ?? [];
  const grounding = enrichedSearch.output?.grounding ?? [];
  const profileSources = (profileSearch.results ?? [])
    .filter((result) => safeString(result.url))
    .map((result) => ({ title: safeString(result.title) || "Professional profile", url: safeString(result.url) }));

  const normalized = structuredLeads
    .map((lead, index) => {
      const name = safeString(lead.name);
      if (!name) return null;
      const reportedCompany = safeString(lead.company);
      if (!companyMatches(reportedCompany, company)) return null;
      const linkedinUrl = validateLinkedinUrl(safeString(lead.linkedin_url));
      const fieldSources = sourcesForLead(grounding, index);
      const matchedProfiles = profileSources.filter(
        (source) =>
          source.title.toLowerCase().includes(name.toLowerCase()) ||
          (linkedinUrl && source.url === linkedinUrl)
      );
      const emailText = safeString(lead.email);
      const emails = uniqueEmails(emailText);
      const emailSources = publicEmailSources(name, emails, publicContactSearch.results ?? []);
      const groundedEmailSources = sourcesForLeadField(grounding, index, "email");
      const validatedEmails = emailSources.length || groundedEmailSources.length ? emails : [];
      const sources = dedupeSources([...fieldSources, ...matchedProfiles, ...emailSources]);

      return {
        id: `${slug(name)}-${index}`,
        name,
        company: reportedCompany,
        title: safeString(lead.title) || jobTitle,
        emails: validatedEmails,
        phone: sources.length ? nullableString(lead.phone) : null,
        linkedinUrl,
        notes: nullableString(lead.notes),
        sources,
      };
    })
    .filter((lead): lead is LeadResult => Boolean(lead));

  if (normalized.length) return normalized.slice(0, 8);

  return [];
}

async function searchExa(apiKey: string, body: object): Promise<ExaResponse> {
  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as ExaResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || `Exa request failed (${response.status}).`);
  }
  return data;
}

function sourcesForLead(grounding: ExaGrounding[], index: number) {
  const indexPatterns = [`leads[${index}]`, `leads.${index}`, `leads/${index}`];
  return grounding
    .filter((item) => indexPatterns.some((pattern) => safeString(item.field).includes(pattern)))
    .flatMap((item) => item.citations ?? [])
    .filter((citation) => safeString(citation.url))
    .map((citation) => ({
      title: safeString(citation.title) || "Public source",
      url: safeString(citation.url),
    }));
}

function sourcesForLeadField(grounding: ExaGrounding[], index: number, field: string) {
  const indexPatterns = [`leads[${index}]`, `leads.${index}`, `leads/${index}`];
  return grounding
    .filter(
      (item) =>
        indexPatterns.some((pattern) => safeString(item.field).includes(pattern)) &&
        safeString(item.field).toLowerCase().includes(field.toLowerCase())
    )
    .flatMap((item) => item.citations ?? [])
    .filter((citation) => safeString(citation.url));
}

function publicEmailSources(name: string, emails: string[], results: ExaResult[]) {
  if (!emails.length) return [];
  const surname = name.split(/\s+/).at(-1)?.toLowerCase() ?? "";
  return results
    .filter((result) => {
      const text = `${safeString(result.title)} ${(result.highlights ?? []).join(" ")}`.toLowerCase();
      return surname && text.includes(surname) && emails.some((email) => text.includes(email.toLowerCase()));
    })
    .filter((result) => safeString(result.url))
    .map((result) => ({ title: safeString(result.title) || "Public contact source", url: safeString(result.url) }));
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: unknown) {
  return safeString(value) || null;
}

function validateLinkedinUrl(value: string) {
  return LINKEDIN_PROFILE.test(value) ? value : null;
}

function uniqueEmails(value: string) {
  return Array.from(new Set((value.match(EMAIL_PATTERN) ?? []).map((email) => email.toLowerCase())));
}

function dedupeSources(sources: LeadSource[]) {
  return Array.from(new Map(sources.map((source) => [source.url, source])).values());
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function companyMatches(value: string, requested: string) {
  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const actual = normalize(value);
  const target = normalize(requested);
  return Boolean(actual && target && (actual.includes(target) || target.includes(actual)));
}
