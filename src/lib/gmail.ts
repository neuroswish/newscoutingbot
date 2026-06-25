import { prisma } from "./prisma";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email";

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export type GmailMessageSummary = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
};

export function getGmailScope() {
  return GMAIL_SCOPE;
}

export function getRedirectUri(requestUrl: string) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  return new URL("/api/gmail/callback", requestUrl).toString();
}

export function buildGoogleAuthUrl(requestUrl: string, state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is missing.");
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getRedirectUri(requestUrl));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeCodeForTokens(code: string, requestUrl: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are missing.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(requestUrl),
      grant_type: "authorization_code",
    }),
  });

  const tokens = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || tokens.error) {
    throw new Error(tokens.error_description || tokens.error || "Google token exchange failed.");
  }

  return tokens;
}

export async function saveGmailConnection(tokens: GoogleTokenResponse) {
  const profile = await fetchGoogleProfile(tokens.access_token);
  return prisma.gmailConnection.upsert({
    where: { id: "local" },
    create: {
      id: "local",
      email: profile.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: expiryDate(tokens.expires_in),
      scope: tokens.scope,
      tokenType: tokens.token_type,
    },
    update: {
      email: profile.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiryDate: expiryDate(tokens.expires_in),
      scope: tokens.scope,
      tokenType: tokens.token_type,
    },
  });
}

export async function getValidAccessToken() {
  const connection = await prisma.gmailConnection.findUnique({ where: { id: "local" } });
  if (!connection) {
    throw new Error("Gmail is not connected yet.");
  }

  const expiresSoon =
    connection.expiryDate && connection.expiryDate.getTime() < Date.now() + 60_000;
  if (!expiresSoon) {
    return connection.accessToken;
  }

  if (!connection.refreshToken) {
    throw new Error("Gmail access expired. Reconnect Gmail to continue.");
  }

  const refreshed = await refreshAccessToken(connection.refreshToken);
  await prisma.gmailConnection.update({
    where: { id: "local" },
    data: {
      accessToken: refreshed.access_token,
      expiryDate: expiryDate(refreshed.expires_in),
      scope: refreshed.scope || connection.scope,
      tokenType: refreshed.token_type || connection.tokenType,
    },
  });

  return refreshed.access_token;
}

export async function fetchGmailMessagesForEmail(email: string): Promise<GmailMessageSummary[]> {
  const accessToken = await getValidAccessToken();
  const query = `{from:${email} to:${email}}`;
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("maxResults", "12");

  const listResponse = await gmailFetch(accessToken, listUrl);
  const list = (await listResponse.json()) as {
    messages?: Array<{ id: string; threadId: string }>;
  };

  if (!list.messages?.length) return [];

  const messages = await Promise.all(
    list.messages.map(async (message) => {
      const detailUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`);
      detailUrl.searchParams.set("format", "metadata");
      detailUrl.searchParams.append("metadataHeaders", "Subject");
      detailUrl.searchParams.append("metadataHeaders", "From");
      detailUrl.searchParams.append("metadataHeaders", "To");
      detailUrl.searchParams.append("metadataHeaders", "Date");
      const response = await gmailFetch(accessToken, detailUrl);
      const detail = (await response.json()) as {
        id: string;
        threadId: string;
        snippet?: string;
        payload?: { headers?: Array<{ name: string; value: string }> };
      };
      const headers = detail.payload?.headers ?? [];
      const header = (name: string) =>
        headers.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value ?? "";

      return {
        id: detail.id,
        threadId: detail.threadId,
        subject: header("Subject") || "(No subject)",
        from: header("From"),
        to: header("To"),
        date: header("Date"),
        snippet: detail.snippet ?? "",
      };
    })
  );

  return messages;
}

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are missing.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokens = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || tokens.error) {
    throw new Error(tokens.error_description || tokens.error || "Could not refresh Gmail access.");
  }
  return tokens;
}

async function gmailFetch(accessToken: string, url: URL) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Gmail request failed.");
  }
  return response;
}

async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return { email: null as string | null };
  const profile = (await response.json()) as { email?: string };
  return { email: profile.email ?? null };
}

function expiryDate(expiresIn: number | undefined) {
  return expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
}
