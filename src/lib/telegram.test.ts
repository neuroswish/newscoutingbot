import { describe, expect, test } from "bun:test";
import { buildTelegramReply } from "./telegram";

describe("buildTelegramReply", () => {
  test("builds a lead-search reply from shared Instagram text", () => {
    const reply = buildTelegramReply({
      message: {
        chat: { id: 123 },
        text: "https://www.instagram.com/p/example/ @asterathletics could be a fit.",
      },
    });

    expect(reply?.chatId).toBe(123);
    expect(reply?.text).toContain("Aster Athletics");
    expect(reply?.text).toContain("Top lead");
    expect(reply?.text).toContain("human review");
  });

  test("prompts for a post when the message has no usable text", () => {
    const reply = buildTelegramReply({ message: { chat: { id: 123 } } });

    expect(reply?.text).toContain("Instagram post");
  });
});
