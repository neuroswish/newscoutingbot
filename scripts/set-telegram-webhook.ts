const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const publicUrl = process.argv[2]?.replace(/\/$/, "");

if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing.");
if (!secret) throw new Error("TELEGRAM_WEBHOOK_SECRET is missing.");
if (!publicUrl) throw new Error("Pass the public app URL, e.g. bun run telegram:set-webhook https://example.vercel.app");

const webhookUrl = `${publicUrl}/api/telegram/webhook`;
const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    allowed_updates: ["message", "edited_message"],
    secret_token: secret,
    url: webhookUrl,
  }),
});

const result = (await response.json()) as { ok?: boolean; description?: string };
if (!response.ok || !result.ok) {
  throw new Error(result.description || `Telegram setWebhook failed (${response.status}).`);
}

console.log(`Telegram webhook set to ${webhookUrl}`);
