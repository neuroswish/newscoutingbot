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

  test("handles Instagram HTML entity handles from official post metadata", async () => {
    const identity = await resolveInstagramBrand({
      fetcher: mockFetch(`
        <html>
          <head>
            <meta property="og:title" content="ERES Paris (&#064;eres) &#x2022; Instagram photo" />
            <meta property="og:description" content="484 likes, 6 comments - eres on June 23, 2026" />
          </head>
        </html>
      `),
      postUrl: "https://www.instagram.com/p/DZ7y_biDJhr/",
      text: "https://www.instagram.com/p/DZ7y_biDJhr/?igsh=MWNlczF6aW10YXZqMA==",
    });

    expect(identity?.brand).toBe("ERES Paris");
    expect(identity?.username).toBe("eres");
    expect(identity?.source).toBe("instagram_metadata");
  });

  test("uses browser navigation headers when fetching Instagram metadata", async () => {
    const requests: Array<{ headers: HeadersInit | undefined; url: string }> = [];
    await resolveInstagramBrand({
      fetcher: (async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({ headers: init?.headers, url: String(input) });
        return new Response(`
          <meta property="og:title" content="ERES Paris (&#064;eres) &#x2022; Instagram photo" />
        `);
      }) as typeof fetch,
      postUrl: "https://www.instagram.com/p/DZ7y_biDJhr/",
      text: "https://www.instagram.com/p/DZ7y_biDJhr/",
    });

    expect(requests[0].url).toBe("https://www.instagram.com/p/DZ7y_biDJhr/");
    expect(requests[0].headers).toMatchObject({
      Accept: expect.stringContaining("text/html"),
      "Sec-Fetch-Mode": "navigate",
      "User-Agent": expect.stringContaining("Chrome/124"),
    });
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

  test("handles absolute embed profile links with tracking query strings", async () => {
    const identity = await resolveInstagramBrand({
      fetcher: mockFetchByUrl({
        "https://www.instagram.com/reel/example/": "<html><head><title>Instagram</title></head></html>",
        "https://www.instagram.com/reel/example/embed/captioned/": `
          <html>
            <body>
              <a href="https://www.instagram.com/asterathletics/?utm_source=ig_embed">Aster Athletics</a>
            </body>
          </html>
        `,
      }),
      postUrl: "https://www.instagram.com/reel/example/",
      text: "https://www.instagram.com/reel/example/",
    });

    expect(identity?.brand).toBe("Aster Athletics");
    expect(identity?.username).toBe("asterathletics");
  });

  test("handles escaped JSON account fields in Instagram HTML", async () => {
    const identity = await resolveInstagramBrand({
      fetcher: mockFetchByUrl({
        "https://www.instagram.com/p/example/": "<html><head><title>Instagram</title></head></html>",
        "https://www.instagram.com/p/example/embed/captioned/": `
          <script>
            window.__data = "{\\"ownerUsername\\":\\"asterathletics\\",\\"full_name\\":\\"Aster Athletics\\"}";
          </script>
        `,
      }),
      postUrl: "https://www.instagram.com/p/example/",
      text: "https://www.instagram.com/p/example/",
    });

    expect(identity?.brand).toBe("Aster Athletics");
    expect(identity?.username).toBe("asterathletics");
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
