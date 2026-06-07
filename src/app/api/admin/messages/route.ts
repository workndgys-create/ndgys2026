import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Messages API Error:", error);

    return NextResponse.json({
      success: false,
      messages: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch messages",
    });
  }
}
