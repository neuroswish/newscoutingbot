export type InstagramBrandIdentity = {
  brand: string;
  confidence: number;
  displayName: string | null;
  source: "instagram_metadata" | "instagram_embed" | "shared_message_handle";
  sourceLabel: string;
  username: string | null;
};

type ResolveInstagramBrandInput = {
  fetcher?: typeof fetch;
  postUrl: string | null;
  text: string;
};

const INSTAGRAM_HANDLE_PATTERN = /@([a-z0-9_.]{2,30})/i;
const INSTAGRAM_HOST_PATTERN = /^https?:\/\/(?:www\.)?instagram\.com\//i;
const INSTAGRAM_NAVIGATION_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

export async function resolveInstagramBrand({
  fetcher = fetch,
  postUrl,
  text,
}: ResolveInstagramBrandInput): Promise<InstagramBrandIdentity | null> {
  if (postUrl && INSTAGRAM_HOST_PATTERN.test(postUrl)) {
    for (const candidate of instagramMetadataUrls(postUrl)) {
      const metadataIdentity = await fetchInstagramMetadataIdentity(candidate.url, candidate.source, fetcher).catch(
        (error) => {
          console.error("Unable to fetch Instagram metadata.", error);
          return null;
        }
      );
      if (metadataIdentity) return metadataIdentity;
    }
  }

  const explicitHandle = extractInstagramHandle(text);
  if (explicitHandle) {
    return {
      brand: `@${explicitHandle}`,
      confidence: 78,
      displayName: null,
      source: "shared_message_handle",
      sourceLabel: "Explicit Instagram username in shared message",
      username: explicitHandle,
    };
  }

  return null;
}

async function fetchInstagramMetadataIdentity(
  postUrl: string,
  source: Extract<InstagramBrandIdentity["source"], "instagram_metadata" | "instagram_embed">,
  fetcher: typeof fetch
): Promise<InstagramBrandIdentity | null> {
  const response = await fetcher(postUrl, {
    headers: INSTAGRAM_NAVIGATION_HEADERS,
    redirect: "follow",
  });
  if (!response.ok) return null;

  const html = await response.text();
  const metadataText = [
    extractMetaContent(html, "og:title"),
    extractMetaContent(html, "twitter:title"),
    extractTitle(html),
    extractAccountLinkText(html),
    extractJsonAccountText(html),
    extractMetaContent(html, "og:description"),
    extractMetaContent(html, "description"),
  ]
    .filter(Boolean)
    .map((value) => decodeHtml(value))
    .join("\n");

  const username = extractInstagramHandle(metadataText);
  const displayName = extractDisplayName(metadataText, username);
  const brand = displayName || (username ? `@${username}` : null);
  if (!brand) return null;

  return {
    brand,
    confidence: displayName && username ? 96 : 90,
    displayName,
    source,
    sourceLabel:
      source === "instagram_embed" ? "Official Instagram embed account metadata" : "Official Instagram page metadata",
    username,
  };
}

function instagramMetadataUrls(postUrl: string) {
  const urls: Array<{ source: Extract<InstagramBrandIdentity["source"], "instagram_metadata" | "instagram_embed">; url: string }> = [
    { source: "instagram_metadata", url: postUrl },
  ];
  const embedUrl = toInstagramEmbedUrl(postUrl);
  if (embedUrl) urls.push({ source: "instagram_embed", url: embedUrl });
  return urls;
}

function toInstagramEmbedUrl(postUrl: string) {
  const match = postUrl.match(/instagram\.com\/(p|reel|tv)\/([^/?#]+)/i);
  if (!match) return null;
  return `https://www.instagram.com/${match[1].toLowerCase()}/${match[2]}/embed/captioned/`;
}

function extractDisplayName(text: string, username: string | null) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const withUsername = line.match(/^(.+?)\s+\(@([a-z0-9_.]{2,30})\)\s*(?:•|on Instagram|$)/i);
    if (withUsername && (!username || normalizeHandle(withUsername[2]) === username)) {
      return cleanDisplayName(withUsername[1]);
    }

    const onInstagram = line.match(/^(.+?)\s+on Instagram(?::|$)/i);
    if (onInstagram) {
      return cleanDisplayName(onInstagram[1]);
    }

    const photoBy = line.match(/^Instagram (?:photo|video|reel) by (.+?)(?:\s+on Instagram|:|•|$)/i);
    if (photoBy) {
      return cleanDisplayName(photoBy[1]);
    }
  }

  return null;
}

function extractAccountLinkText(html: string) {
  const linkPattern =
    /<a\b[^>]*href=["'](?:https?:\/\/(?:www\.)?instagram\.com)?\/([a-z0-9_.]{2,30})(?:\/|\?)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches = Array.from(html.matchAll(linkPattern));
  const account = matches.find((match) => isLikelyAccountHandle(match[1]));
  if (!account) return "";

  const username = normalizeHandle(account[1]);
  const label = decodeHtml(stripTags(account[2]));
  const displayName = cleanDisplayName(label);
  return displayName ? `${displayName} (@${username}) on Instagram` : `@${username}`;
}

function extractJsonAccountText(html: string) {
  const decodedHtml = decodeHtml(html);
  const username =
    readJsonString(decodedHtml, "ownerUsername") ||
    readJsonString(decodedHtml, "owner_username") ||
    readJsonString(decodedHtml, "username") ||
    readEscapedJsonString(decodedHtml, "ownerUsername") ||
    readEscapedJsonString(decodedHtml, "owner_username") ||
    readEscapedJsonString(decodedHtml, "username");
  if (!username || !isLikelyAccountHandle(username)) return "";

  const displayName =
    readJsonString(decodedHtml, "full_name") ||
    readJsonString(decodedHtml, "fullName") ||
    readJsonString(decodedHtml, "name") ||
    readEscapedJsonString(decodedHtml, "full_name") ||
    readEscapedJsonString(decodedHtml, "fullName") ||
    readEscapedJsonString(decodedHtml, "name");
  const cleanName = displayName ? cleanDisplayName(decodeHtml(displayName)) : null;
  return cleanName ? `${cleanName} (@${normalizeHandle(username)}) on Instagram` : `@${normalizeHandle(username)}`;
}

function cleanDisplayName(value: string) {
  const cleaned = value.replace(/^["'“”]+|["'“”]+$/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned || /^instagram$/i.test(cleaned)) return null;
  return cleaned.slice(0, 90);
}

function extractInstagramHandle(value: string) {
  const handle = value.match(INSTAGRAM_HANDLE_PATTERN)?.[1] ?? null;
  return handle ? normalizeHandle(handle) : null;
}

function normalizeHandle(handle: string) {
  return handle.toLowerCase().replace(/[^a-z0-9_.]/g, "");
}

function isLikelyAccountHandle(handle: string) {
  const normalized = normalizeHandle(handle);
  return (
    normalized.length >= 2 &&
    ![
      "about",
      "accounts",
      "api",
      "developer",
      "direct",
      "explore",
      "legal",
      "p",
      "press",
      "reel",
      "tv",
    ].includes(normalized)
  );
}

function extractMetaContent(html: string, name: string) {
  const metaTags = html.match(/<meta[^>]+>/gi) ?? [];
  const matchingTag = metaTags.find((tag) => {
    const property = readAttribute(tag, "property") || readAttribute(tag, "name");
    return property.toLowerCase() === name.toLowerCase();
  });
  return matchingTag ? readAttribute(matchingTag, "content") : "";
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&#(\d+);?/g, (_, codepoint: string) => String.fromCodePoint(Number(codepoint)))
    .replace(/&#x([0-9a-f]+);?/gi, (_, codepoint: string) => String.fromCodePoint(Number.parseInt(codepoint, 16)))
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function readJsonString(html: string, key: string) {
  const pattern = new RegExp(`["']${escapeRegExp(key)}["']\\s*:\\s*["']([^"']+)["']`, "i");
  return html.match(pattern)?.[1] ?? "";
}

function readEscapedJsonString(html: string, key: string) {
  const pattern = new RegExp(`\\\\["']${escapeRegExp(key)}\\\\["']\\s*:\\s*\\\\["']([^"'\\\\]+)\\\\["']`, "i");
  return html.match(pattern)?.[1] ?? "";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readAttribute(tag: string, name: string) {
  const pattern = new RegExp(`${escapeRegExp(name)}=["']([^"']*)["']`, "i");
  return tag.match(pattern)?.[1] ?? "";
}
