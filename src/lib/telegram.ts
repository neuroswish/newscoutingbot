import { analyzeSharedPost } from "./bot-intake";

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

const INSTAGRAM_URL_PATTERN = /https?:\/\/(?:www\.)?instagram\.com\/[^\s)]+/i;

export function buildTelegramReply(update: TelegramUpdate): TelegramBotReply | null {
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
  const result = analyzeSharedPost({
    platform: "telegram",
    postUrl: postUrl ?? "",
    caption: text,
  });
  const topLead = result.leads[0];
  const emailLabel = topLead?.email ? `${topLead.email} (${topLead.emailConfidence})` : "needs more research";

  return {
    chatId,
    text: [
      result.replyText,
      "",
      `Brand: ${result.brand} (${result.confidence}% confidence)`,
      topLead ? `Top lead: ${topLead.name}, ${topLead.title}` : "Top lead: none yet",
      `Email: ${emailLabel}`,
      "",
      "Next: I queued this for human review before any outreach is sent.",
    ].join("\n"),
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
