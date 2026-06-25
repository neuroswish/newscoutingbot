import { NextResponse } from "next/server";
import { findLeadsWithExa } from "@/lib/exa";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { company?: unknown; jobTitle?: unknown };
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";

  if (!company || !jobTitle) {
    return NextResponse.json({ error: "Enter a company and a job title." }, { status: 400 });
  }

  if (company.length > 120 || jobTitle.length > 120) {
    return NextResponse.json({ error: "Keep company and job title under 120 characters." }, { status: 400 });
  }

  try {
    const leads = await findLeadsWithExa(company, jobTitle);
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lead search could not be completed." },
      { status: 400 }
    );
  }
}
