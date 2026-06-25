import { describe, expect, test } from "bun:test";
import {
  buildDemoOutreachLeads,
  createPartnershipOutreachDraft,
  summarizeEmailConfidence,
} from "./outreach";

describe("outreach helpers", () => {
  test("creates direct-person demo leads for a target brand", () => {
    const leads = buildDemoOutreachLeads("Aster Athletics");

    expect(leads).toHaveLength(5);
    expect(leads[0]?.company).toBe("Aster Athletics");
    expect(leads[0]?.emailConfidence).toBe("listed");
    expect(leads[1]?.emailConfidence).toBe("inferred");
    expect(leads.at(-1)?.email).toBeNull();
  });

  test("builds a personalized partnership draft", () => {
    const [lead] = buildDemoOutreachLeads("Maison Lumi");
    const draft = createPartnershipOutreachDraft(lead!, "July");

    expect(draft.subject).toContain("July");
    expect(draft.body).toContain("Hi Maya");
    expect(draft.body).toContain("Maison Lumi");
  });

  test("summarizes email confidence labels", () => {
    expect(summarizeEmailConfidence("listed")).toBe("Publicly listed");
    expect(summarizeEmailConfidence("inferred")).toBe("Inferred pattern");
    expect(summarizeEmailConfidence("missing")).toBe("Needs email");
  });
});
