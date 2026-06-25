export type LeadSource = {
  title: string;
  url: string;
};

export type LeadResult = {
  id: string;
  name: string;
  company: string;
  title: string;
  emails: string[];
  phone: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  sources: LeadSource[];
};

export function createOutreachDraft(lead: LeadResult) {
  const firstName = lead.name.split(/\s+/)[0] || lead.name;
  const subject = `Potential projects with New Scouting Management`;
  const body = [
    `Hi ${firstName},`,
    "",
    `I'm Joe from New Scouting Management. I came across your work as ${lead.title || "part of the team"} at ${lead.company} and wanted to introduce myself.`,
    "",
    "We represent models for fashion and creative projects, and I wanted to ask whether you have any upcoming projects where new talent might be a fit.",
    "",
    "Happy to share options or put together a focused selection if useful.",
    "",
    "Best,",
    "Joe",
    "New Scouting Management",
  ].join("\n");

  return { subject, body };
}
