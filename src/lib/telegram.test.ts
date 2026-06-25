import { describe, expect, mock, test } from "bun:test";
import { buildTelegramReply } from "./telegram";

const findLeads = mock(async () => [
  {
    company: "Aster Athletics",
    emails: ["maya@aster.example"],
    id: "maya-chen",
    linkedinUrl: "https://www.linkedin.com/in/maya-chen",
    name: "Maya Chen",
    notes: "Public brand partnerships contact.",
    phone: null,
    sources: [{ title: "Aster creator partnerships page", url: "https://aster.example/partners" }],
    title: "Director of Social Partnerships",
  },
]);

describe("buildTelegramReply", () => {
  test("builds a live lead-search reply from shared Instagram text", async () => {
    const reply = await buildTelegramReply(
      {
        message: {
          chat: { id: 123 },
          text: "https://www.instagram.com/p/example/ @asterathletics could be a fit.",
        },
      },
      { findLeads }
    );

    expect(reply?.chatId).toBe(123);
    expect(reply?.text).toContain("Brand identified: Aster Athletics");
    expect(reply?.text).toContain("Possible brand contacts:");
    expect(reply?.text).toContain("Maya Chen");
    expect(reply?.text).toContain("maya@aster.example");
    expect(reply?.text).toContain("Draft email:");
    expect(reply?.text).toContain("Model partnership opportunities with Aster Athletics");
    expect(findLeads).toHaveBeenCalledWith(
      "Aster Athletics",
      "Influencer Marketing Manager OR Social Media Manager OR Brand Partnerships Manager OR Brand Marketing Lead"
    );
  });

  test("prompts for a post when the message has no usable text", async () => {
    const reply = await buildTelegramReply({ message: { chat: { id: 123 } } });

    expect(reply?.text).toContain("Instagram post");
  });
});
