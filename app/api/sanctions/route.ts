import { NextResponse } from "next/server";
import { getSanctionedVessels } from "@/lib/sanctions";

export async function GET() {
  try {
    const sanctioned = await getSanctionedVessels();
    const entries = Array.from(sanctioned.entries()).map(([imo, data]) => ({
      imo,
      ...data,
    }));
    return NextResponse.json({ count: entries.length, fetchedAt: Date.now() });
  } catch (err) {
    return NextResponse.json({ count: 0, error: String(err) });
  }
}
