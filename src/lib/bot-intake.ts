import { buildDemoOutreachLeads, createPartnershipOutreachDraft, type OutreachLead } from "./outreach";

export type BotPlatform = "telegram" | "whatsapp";

export type SharedPostInput = {
  platform: BotPlatform;
  postUrl: string;
  caption: string;
};

export type BrandSignal = {
  label: string;
  value: string;
  confidence: "high" | "medium" | "low";
};

export type BotIntakeResult = {
  brand: string;
  confidence: number;
  signals: BrandSignal[];
  leads: OutreachLead[];
  replyText: string;
  draftSubject: string;
  draftPreview: string;
  steps: Array<{ label: string; status: "done" | "review" | "queued" }>;
};

const HANDLE_BRANDS: Record<string, string> = {
  asterathletics: "Aster Athletics",
  harbor_denim: "Harbor Denim",
  maisonlumi: "Maison Lumi",
  northlinebeauty: "Northline Beauty",
  verdestudio: "Verde Studio",
};

export function analyzeSharedPost(input: SharedPostInput): BotIntakeResult {
  const handle = findBrandHandle(input.caption) ?? findBrandHandle(input.postUrl);
  const brand = handle ? brandFromHandle(handle) : findBrandName(input.caption) ?? "Maison Lumi";
  const signals = buildSignals(input, brand, handle);
  const leads = buildDemoOutreachLeads(brand);
  const topLead = leads[0];
  const draft = topLead ? createPartnershipOutreachDraft(topLead, "next month") : null;

  return {
    brand,
    confidence: handle ? 91 : 73,
    signals,
    leads,
    replyText:
      input.platform === "telegram"
        ? `Got it. I found ${brand}, checked for social/marketing leads, and queued the best contact for review.`
        : `Received. I found ${brand} and prepared a reviewed outreach draft before anything is sent.`,
    draftSubject: draft?.subject ?? "Model partnership opportunities",
    draftPreview: draft?.body ?? "",
    steps: [
      { label: "Post received from shared message", status: "done" },
      { label: "Brand identity extracted", status: "done" },
      { label: "Marketing and social leads searched", status: "done" },
      { label: "Email confidence requires review", status: "review" },
      { label: "Outreach draft queued", status: "queued" },
    ],
  };
}

function buildSignals(input: SharedPostInput, brand: string, handle: string | null): BrandSignal[] {
  const signals: BrandSignal[] = [
    {
      label: "Shared via",
      value: input.platform === "telegram" ? "Telegram bot DM" : "WhatsApp bot chat",
      confidence: "high",
    },
    {
      label: "Detected brand",
      value: brand,
      confidence: handle ? "high" : "medium",
    },
  ];

  if (handle) {
    signals.push({ label: "Instagram handle", value: `@${handle}`, confidence: "high" });
  }

  if (input.postUrl) {
    signals.push({ label: "Post URL", value: input.postUrl, confidence: "medium" });
  }

  return signals;
}

function findBrandHandle(value: string) {
  const handle = value.match(/@([a-z0-9_.]+)/i)?.[1] ?? null;
  return handle ? normalizeHandle(handle) : null;
}

function findBrandName(value: string) {
  const match = Object.values(HANDLE_BRANDS).find((brand) => value.toLowerCase().includes(brand.toLowerCase()));
  return match ?? null;
}

function brandFromHandle(handle: string) {
  return HANDLE_BRANDS[handle] ?? titleize(handle.replaceAll("_", " "));
}

function normalizeHandle(handle: string) {
  return handle.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function titleize(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
