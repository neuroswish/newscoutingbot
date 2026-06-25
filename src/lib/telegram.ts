import { findLeadsWithExa } from "./exa";
import { resolveInstagramBrand, type InstagramBrandIdentity } from "./instagram";
import type { LeadResult } from "./leads";

type TelegramMessageEntity = {
  offset: number;
  length: number;
  type: string;
  url?: string;
};

type TelegramMessage = {
  caption?: string;
  caption_entities?: TelegramMessageEntity[];
  chat?: { id?: number | string };
  entities?: TelegramMessageEntity[];
  text?: string;
};

export type TelegramUpdate = {
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
};

export type TelegramBotReply = {
  chatId: number | string;
  text: string;
};

type TelegramReplyOptions = {
  findLeads?: typeof findLeadsWithExa;
  resolveBrand?: typeof resolveInstagramBrand;
};

const INSTAGRAM_URL_PATTERN = /https?:\/\/(?:www\.)?instagram\.com\/[^\s)]+/i;
const BRAND_CONTACT_QUERY =
  "Influencer Marketing Manager OR Social Media Manager OR Brand Partnerships Manager OR Brand Marketing Lead";
const MAX_TELEGRAM_LEADS = 4;

export async function buildTelegramReply(
  update: TelegramUpdate,
  options: TelegramReplyOptions = {}
): Promise<TelegramBotReply | null> {
  const message = update.message ?? update.edited_message;
  const chatId = message?.chat?.id;
  if (!message || chatId === undefined) return null;

  const text = [message.text, message.caption].filter(Boolean).join("\n").trim();
  if (!text) {
    return {
      chatId,
      text: "Send or forward an Instagram post link/caption and I will look for the brand plus marketing/social contacts.",
    };
  }

  const postUrl = extractInstagramUrl(text, [...(message.entities ?? []), ...(message.caption_entities ?? [])]);
  const brandIdentity = await (options.resolveBrand ?? resolveInstagramBrand)({ postUrl, text });
  if (!brandIdentity) {
    return {
      chatId,
      text: [
        "I could not confidently identify the brand from official Instagram metadata.",
        "",
        "I will not guess from the post URL alone. Please resend the post using Instagram's share action, or include the Instagram username/display name shown on the post.",
      ].join("\n"),
    };
  }

  const leadPacket = await findBrandContactPacket(brandIdentity.brand, options.findLeads ?? findLeadsWithExa);

  return {
    chatId,
    text: formatLeadPacketReply({
      brand: brandIdentity.brand,
      brandIdentity,
      confidence: brandIdentity.confidence,
      draft: leadPacket.draft,
      leads: leadPacket.leads,
      mode: leadPacket.mode,
      searchNote: leadPacket.searchNote,
    }),
  };
}

export async function sendTelegramMessage(reply: TelegramBotReply) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing.");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: reply.chatId,
      disable_web_page_preview: true,
      text: reply.text,
    }),
  });

  const data = (await response.json()) as { ok?: boolean; description?: string };
  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram sendMessage failed (${response.status}).`);
  }

  return data;
}

function extractInstagramUrl(text: string, entities: TelegramMessageEntity[]) {
  for (const entity of entities) {
    if (entity.type === "text_link" && entity.url && INSTAGRAM_URL_PATTERN.test(entity.url)) {
      return entity.url;
    }

    if (entity.type === "url") {
      const value = text.slice(entity.offset, entity.offset + entity.length);
      if (INSTAGRAM_URL_PATTERN.test(value)) return value;
    }
  }

  return text.match(INSTAGRAM_URL_PATTERN)?.[0] ?? null;
}

type TelegramLead = {
  name: string;
  title: string;
  company: string;
  email: string | null;
  emailLabel: string;
  notes: string;
  source: string;
};

type LeadPacket = {
  draft: { subject: string; body: string };
  leads: TelegramLead[];
  mode: "live" | "no-results" | "unavailable";
  searchNote: string;
};

async function findBrandContactPacket(
  brand: string,
  findLeads: typeof findLeadsWithExa
): Promise<LeadPacket> {
  try {
    const liveLeads = await findLeads(brand, BRAND_CONTACT_QUERY);
    const leads = normalizeLiveTelegramLeads(liveLeads);
    if (leads.length) {
      return {
        draft: createTelegramPartnershipDraft(brand, leads[0]),
        leads,
        mode: "live",
        searchNote: "Searched public web sources for marketing/social partnership contacts.",
      };
    }
    return {
      draft: createTelegramPartnershipDraft(brand),
      leads: [],
      mode: "no-results",
      searchNote:
        "I searched public web sources but did not find strong named marketing/social contacts with grounded evidence yet.",
    };
  } catch (error) {
    console.error("Telegram lead search failed.", error);
    return {
      draft: createTelegramPartnershipDraft(brand),
      leads: [],
      mode: "unavailable",
      searchNote: "Live web search was unavailable, so I did not include unverified contacts or guessed emails.",
    };
  }
}

function normalizeLiveTelegramLeads(leads: LeadResult[]): TelegramLead[] {
  return [...leads]
    .sort((a, b) => Number(Boolean(b.emails.length)) - Number(Boolean(a.emails.length)))
    .slice(0, MAX_TELEGRAM_LEADS)
    .map((lead) => ({
      company: lead.company,
      email: lead.emails[0] ?? null,
      emailLabel: lead.emails[0] ? "Publicly listed" : "No public email found",
      name: lead.name,
      notes: lead.notes ?? "Role appears relevant for brand, social, creator, or partnership outreach.",
      source: lead.sources[0]?.title ?? lead.linkedinUrl ?? "Public web result",
      title: lead.title,
    }));
}

function formatLeadPacketReply({
  brand,
  brandIdentity,
  confidence,
  draft,
  leads,
  mode,
  searchNote,
}: {
  brand: string;
  brandIdentity: InstagramBrandIdentity;
  confidence: number;
  draft: { subject: string; body: string };
  leads: TelegramLead[];
  mode: LeadPacket["mode"];
  searchNote: string;
}) {
  const leadLines = leads.length
    ? leads.flatMap((lead, index) => [
        `${index + 1}. ${lead.name} — ${lead.title}`,
        `   Email: ${lead.email ?? "not publicly listed"} (${lead.emailLabel})`,
        `   Source: ${lead.source}`,
      ])
    : ["No strong contacts found yet."];

  return [
    `Brand identified: ${brand} (${confidence}% confidence)`,
    brandIdentity.username ? `Instagram username: @${brandIdentity.username}` : null,
    `Brand source: ${brandIdentity.sourceLabel}`,
    "",
    "Possible brand contacts:",
    ...leadLines,
    "",
    searchNote,
    "",
    "Draft email:",
    `Subject: ${draft.subject}`,
    "",
    draft.body,
    "",
    "Next: Review the contacts and email before sending.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function createTelegramPartnershipDraft(brand: string, lead?: TelegramLead) {
  const firstName = lead?.name.split(/\s+/)[0] || "there";
  return {
    subject: `Model partnership opportunities with ${brand}`,
    body: [
      `Hi ${firstName},`,
      "",
      `I'm Joe from New Scouting Management. I came across ${brand} and wanted to ask whether your team is exploring model partnerships for upcoming creator, campaign, or event needs.`,
      "",
      "We represent a focused roster of models and can send over a tight selection based on the briefs your team is prioritizing for the upcoming month or quarter.",
      "",
      "Are you the right person to speak with about partnership opportunities?",
      "",
      "Best,",
      "Joe",
      "New Scouting Management",
    ].join("\n"),
  };
}
