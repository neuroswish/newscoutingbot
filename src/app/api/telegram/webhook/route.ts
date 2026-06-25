import { NextResponse } from "next/server";
import { buildTelegramReply, sendTelegramMessage, type TelegramUpdate } from "@/lib/telegram";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, service: "telegram-webhook" });
}

export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid Telegram webhook secret." }, { status: 401 });
    }
  }

  const update = (await request.json()) as TelegramUpdate;
  const reply = await buildTelegramReply(update);
  if (!reply) return NextResponse.json({ ok: true, ignored: true });

  await sendTelegramMessage(reply);
  return NextResponse.json({ ok: true });
}
