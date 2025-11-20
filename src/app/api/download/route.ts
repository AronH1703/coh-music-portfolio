import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json(
      { error: "Missing url query parameter." },
      { status: 400 },
    );
  }

  try {
    const target = new URL(urlParam);
    return NextResponse.redirect(target.toString());
  } catch {
    return NextResponse.json(
      { error: "Invalid download URL." },
      { status: 400 },
    );
  }
}
