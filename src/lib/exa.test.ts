import { describe, expect, test } from "bun:test";
import { normalizeLeadResults } from "./exa";

describe("normalizeLeadResults", () => {
  test("returns a grounded public email and matching profile", () => {
    const leads = normalizeLeadResults(
      "Maison Test",
      "Casting Director",
      {
        results: [{ title: "Jordan Lee - Casting Director - Maison Test | LinkedIn", url: "https://www.linkedin.com/in/jordan-lee" }],
      },
      {
        output: {
          content: {
            leads: [
              {
                name: "Jordan Lee",
                company: "Maison Test",
                title: "Casting Director",
                email: "jordan@maisontest.example",
                phone: "",
                linkedin_url: "https://www.linkedin.com/in/jordan-lee",
                notes: "Current public listing.",
              },
            ],
          },
          grounding: [
            {
              field: "leads[0].email",
              citations: [{ title: "Team", url: "https://maisontest.com/team/jordan" }],
            },
          ],
        },
      },
      {
        results: [
          {
            title: "Maison Test contact list - Jordan Lee",
            url: "https://maisontest.com/team/jordan",
            highlights: ["Email Jordan Lee at jordan@maisontest.example."],
          },
        ],
      }
    );

    expect(leads[0]?.emails).toEqual(["jordan@maisontest.example"]);
    expect(leads[0]?.sources).toHaveLength(2);
    expect(leads[0]?.linkedinUrl).toContain("linkedin.com/in/");
  });

  test("does not display ungrounded email output", () => {
    const leads = normalizeLeadResults(
      "Maison Test",
      "Producer",
      {},
      {
        output: {
          content: {
            leads: [{ name: "Avery Kim", company: "Maison Test", email: "invented@example.com", title: "Producer" }],
          },
          grounding: [],
        },
      }
    );

    expect(leads[0]?.emails).toEqual([]);
  });

  test("accepts an email repeated explicitly in public contact-source content", () => {
    const leads = normalizeLeadResults(
      "Maison Verdi",
      "Public Relations",
      {},
      {
        output: {
          content: {
            leads: [
              {
                name: "Alex Rivera",
                company: "Maison Verdi",
                title: "Public Relations",
                email: "alex.rivera@maisonverdi.example",
              },
            ],
          },
          grounding: [],
        },
      },
      {
        results: [
          {
            title: "Maison Verdi press contact: Alex Rivera",
            url: "https://example.com/maison-verdi-release",
            highlights: ["Media contact Alex Rivera, alex.rivera@maisonverdi.example"],
          },
        ],
      }
    );

    expect(leads[0]?.emails).toEqual(["alex.rivera@maisonverdi.example"]);
  });

  test("excludes candidates who do not work at the requested company", () => {
    const leads = normalizeLeadResults(
      "Maison Verdi",
      "Casting Director",
      {},
      {
        output: {
          content: {
            leads: [
              {
                name: "Outside Candidate",
                company: "Independent Casting Studio",
                title: "Casting Director",
                email: "",
              },
            ],
          },
          grounding: [],
        },
      }
    );

    expect(leads).toEqual([]);
  });
});
