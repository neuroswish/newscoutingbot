import { describe, expect, test } from "bun:test";
import { resolveInstagramBrand } from "./instagram";

describe("resolveInstagramBrand", () => {
  test("uses official Instagram metadata display name and username", async () => {
    const identity = await resolveInstagramBrand({
      fetcher: mockFetch(`
        <html>
          <head>
            <meta property="og:title" content="Aster Athletics (@asterathletics) • Instagram photos and videos" />
            <meta property="og:description" content="12K Followers, 300 Following, 90 Posts" />
          </head>
        </html>
      `),
      postUrl: "https://www.instagram.com/p/example/",
      text: "https://www.instagram.com/p/example/",
    });

    expect(identity?.brand).toBe("Aster Athletics");
    expect(identity?.username).toBe("asterathletics");
    expect(identity?.source).toBe("instagram_metadata");
  });

  test("falls back only to an explicit username in the shared message", async () => {
    const identity = await resolveInstagramBrand({
      fetcher: mockFetch("<html><head><title>Instagram</title></head></html>"),
      postUrl: "https://www.instagram.com/p/example/",
      text: "Shared from @asterathletics",
    });

    expect(identity?.brand).toBe("@asterathletics");
    expect(identity?.source).toBe("shared_message_handle");
  });

  test("uses the Instagram embed account link when the post page is stripped", async () => {
    const identity = await resolveInstagramBrand({
      fetcher: mockFetchByUrl({
        "https://www.instagram.com/p/example/": "<html><head><title>Instagram</title></head></html>",
        "https://www.instagram.com/p/example/embed/captioned/": `
          <html>
            <body>
              <header>
                <a href="/asterathletics/">Aster Athletics</a>
              </header>
            </body>
          </html>
        `,
      }),
      postUrl: "https://www.instagram.com/p/example/",
      text: "https://www.instagram.com/p/example/",
    });

    expect(identity?.brand).toBe("Aster Athletics");
    expect(identity?.username).toBe("asterathletics");
    expect(identity?.source).toBe("instagram_embed");
  });

  test("returns null instead of guessing from a post URL alone", async () => {
    const identity = await resolveInstagramBrand({
      fetcher: mockFetch("<html><head><title>Instagram</title></head></html>"),
      postUrl: "https://www.instagram.com/p/example/",
      text: "https://www.instagram.com/p/example/",
    });

    expect(identity).toBeNull();
  });
});

function mockFetch(html: string): typeof fetch {
  return (async () =>
    new Response(html, {
      headers: { "content-type": "text/html" },
      status: 200,
    })) as typeof fetch;
}

function mockFetchByUrl(responses: Record<string, string>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    return new Response(responses[url] ?? "", {
      headers: { "content-type": "text/html" },
      status: responses[url] ? 200 : 404,
    });
  }) as typeof fetch;
}
