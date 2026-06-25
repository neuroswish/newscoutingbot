import { NextResponse } from "next/server";
import { parseContactsWorkbook } from "@/lib/contact-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a CSV or XLSX file." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const preview = parseContactsWorkbook(buffer, file.name);
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not parse the file." },
      { status: 400 }
    );
  }
}
