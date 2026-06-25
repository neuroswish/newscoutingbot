import { describe, expect, test } from "bun:test";
import { analyzeSharedPost } from "./bot-intake";

describe("analyzeSharedPost", () => {
  test("detects a known brand handle from a shared Instagram caption", () => {
    const result = analyzeSharedPost({
      platform: "telegram",
      postUrl: "https://www.instagram.com/p/example/",
      caption: "Loved this new drop from @asterathletics. Could be a model partnership fit.",
    });

    expect(result.brand).toBe("Aster Athletics");
    expect(result.confidence).toBeGreaterThan(85);
    expect(result.leads[0]?.company).toBe("Aster Athletics");
    expect(result.replyText).toContain("queued");
  });

  test("falls back to brand names in caption text", () => {
    const result = analyzeSharedPost({
      platform: "whatsapp",
      postUrl: "",
      caption: "Northline Beauty is running a launch event next month.",
    });

    expect(result.brand).toBe("Northline Beauty");
    expect(result.signals.some((signal) => signal.label === "Detected brand")).toBe(true);
  });
});
