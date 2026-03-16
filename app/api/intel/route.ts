import { NextResponse } from "next/server";
import { fetchAllAdvisories } from "@/lib/feeds";

export async function GET() {
  try {
    const result = await fetchAllAdvisories();
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    return NextResponse.json(
      { items: [], fetchedAt: Date.now(), errors: [String(err)] },
      { status: 200 }
    );
  }
}
