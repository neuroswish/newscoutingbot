export type EmailConfidence = "listed" | "inferred" | "missing";

export type OutreachLead = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string | null;
  emailConfidence: EmailConfidence;
  source: string;
  fitScore: number;
  status: "ready" | "queued" | "sent" | "replied" | "follow-up-due";
  lastTouch: string;
  notes: string;
};

export type OutreachDraft = {
  subject: string;
  body: string;
};

const DEMO_PEOPLE = [
  { name: "Maya Chen", title: "Director of Social Partnerships", source: "LinkedIn profile + creator program page" },
  { name: "Jordan Ellis", title: "Influencer Marketing Manager", source: "LinkedIn profile + event recap byline" },
  { name: "Sofia Grant", title: "Brand Marketing Lead", source: "LinkedIn profile + campaign credits" },
  { name: "Nina Patel", title: "Senior Social Media Manager", source: "LinkedIn profile + public speaker bio" },
  { name: "Camila Reyes", title: "Partnerships Coordinator", source: "LinkedIn profile + newsletter credit" },
];

export function buildDemoOutreachLeads(company: string): OutreachLead[] {
  const normalizedCompany = company.trim() || "Maison Lumi";
  const domain = inferCompanyDomain(normalizedCompany);

  return DEMO_PEOPLE.map((person, index) => {
    const emailConfidence: EmailConfidence = index === 0 ? "listed" : index < 4 ? "inferred" : "missing";
    const email = emailConfidence === "missing" ? null : inferEmail(person.name, domain, index);

    return {
      id: `${slug(normalizedCompany)}-${slug(person.name)}`,
      company: normalizedCompany,
      name: person.name,
      title: person.title,
      email,
      emailConfidence,
      source: person.source,
      fitScore: 94 - index * 7,
      status: index === 2 ? "queued" : "ready",
      lastTouch: index === 2 ? "Draft queued for review" : "Not contacted",
      notes:
        index === 0
          ? "Best match for model partnership conversations; public email appears in a partnership contact block."
          : "Role aligns with social, creator, or brand partnership ownership. Verify current role before sending.",
    };
  });
}

export function createPartnershipOutreachDraft(lead: OutreachLead, monthLabel = "next month"): OutreachDraft {
  const firstName = lead.name.split(/\s+/)[0] || lead.name;
  return {
    subject: `Model partnership opportunities for ${monthLabel}`,
    body: [
      `Hi ${firstName},`,
      "",
      `I'm Joe from New Scouting Management. I saw your work on social and brand partnerships at ${lead.company} and wanted to introduce a few models who could be a fit for upcoming creator, campaign, or event needs.`,
      "",
      `Are you the right person to ask about partnership opportunities for ${monthLabel}? If so, I can send a tight selection based on the briefs your team is prioritizing.`,
      "",
      "Best,",
      "Joe",
      "New Scouting Management",
      "",
      "P.S. Happy to stop reaching out if this is not useful.",
    ].join("\n"),
  };
}

export function summarizeEmailConfidence(confidence: EmailConfidence) {
  if (confidence === "listed") return "Publicly listed";
  if (confidence === "inferred") return "Inferred pattern";
  return "Needs email";
}

function inferCompanyDomain(company: string) {
  return `${slug(company).replaceAll("-", "") || "brand"}example.com`;
}

function inferEmail(name: string, domain: string, index: number) {
  const parts = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/);
  const first = parts[0] ?? "first";
  const last = parts.at(-1) ?? "last";

  if (index === 0) return `${first}.${last}@${domain}`;
  if (index === 1) return `${first[0]}${last}@${domain}`;
  return `${first}@${domain}`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
