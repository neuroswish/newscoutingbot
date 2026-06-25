export type InstagramBrandIdentity = {
  brand: string;
  confidence: number;
  displayName: string | null;
  source: "instagram_metadata" | "shared_message_handle";
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

export async function resolveInstagramBrand({
  fetcher = fetch,
  postUrl,
  text,
}: ResolveInstagramBrandInput): Promise<InstagramBrandIdentity | null> {
  if (postUrl && INSTAGRAM_HOST_PATTERN.test(postUrl)) {
    const metadataIdentity = await fetchInstagramMetadataIdentity(postUrl, fetcher).catch((error) => {
      console.error("Unable to fetch Instagram metadata.", error);
      return null;
    });
    if (metadataIdentity) return metadataIdentity;
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
  fetcher: typeof fetch
): Promise<InstagramBrandIdentity | null> {
  const response = await fetcher(postUrl, {
    headers: {
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
    redirect: "follow",
  });
  if (!response.ok) return null;

  const html = await response.text();
  const metadataText = [
    extractMetaContent(html, "og:title"),
    extractMetaContent(html, "twitter:title"),
    extractTitle(html),
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
    source: "instagram_metadata",
    sourceLabel: "Official Instagram page metadata",
    username,
  };
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
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readAttribute(tag: string, name: string) {
  const pattern = new RegExp(`${escapeRegExp(name)}=["']([^"']*)["']`, "i");
  return tag.match(pattern)?.[1] ?? "";
}
