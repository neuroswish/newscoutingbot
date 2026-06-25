import { describe, expect, test } from "bun:test";
import { parseContactsWorkbook } from "./contact-import";

describe("parseContactsWorkbook", () => {
  test("parses a multi-row contact CSV", () => {
    const csv = Buffer.from(
      [
        "Name,Company,Title,Email,Phone,Notes",
        "Avery Stone,Maison Test,Social Partnerships Lead,avery.stone@maisontest.example,212-555-0101,Priority lead",
        "Riley Brooks,Maison Test,Influencer Marketing Manager,riley.brooks@maisontest.example,212-555-0102,Follow-up in July",
      ].join("\n")
    );
    const preview = parseContactsWorkbook(csv, "contacts.csv");

    expect(preview.contacts).toHaveLength(2);
    expect(preview.contacts[0]?.name).toBe("Avery Stone");
    expect(preview.contacts[0]?.emails).toContain("avery.stone@maisontest.example");
    expect(preview.headers).toContain("Name");
  });

  test("parses a simple first-row contact CSV", () => {
    const csv = Buffer.from(
      "Name,Company,Title,Email,Phone,Notes\nJordan Lee,New Scouting,Booker,jordan@example.com,212-555-0100,VIP contact"
    );
    const preview = parseContactsWorkbook(csv, "contacts.csv");

    expect(preview.contacts).toHaveLength(1);
    expect(preview.contacts[0]?.name).toBe("Jordan Lee");
    expect(preview.contacts[0]?.company).toBe("New Scouting");
    expect(preview.contacts[0]?.emails).toContain("jordan@example.com");
    expect(preview.contacts[0]?.phone).toBe("212-555-0100");
  });
});
