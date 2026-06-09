import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

function parseOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return { ok: true as const, value: null };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return { ok: false as const };
  }

  return { ok: true as const, value: parsed };
}

function parseOptionalDate(value: unknown) {
  if (!value) {
    return { ok: true as const, value: null };
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    return { ok: false as const };
  }

  return { ok: true as const, value: parsed };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const s = await requirePermission("content.manage");

  if (!s) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const b = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};

  // Required string fields
  if ("title" in b) data.title = b.title ?? "";
  if ("category" in b) data.category = b.category ?? "";
  if ("summary" in b) data.summary = b.summary ?? "";
  if ("description" in b) data.description = b.description ?? "";

  // Optional string fields
  if ("prize" in b) data.prize = b.prize || null;
  if ("ctaUrl" in b) data.ctaUrl = b.ctaUrl || null;
  if ("imageUrl" in b) data.imageUrl = b.imageUrl || null;

  if ("published" in b) {
    data.published = !!b.published;
  }

  if ("order" in b) {
    const parsed = parseOptionalNumber(b.order);

    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Order must be a valid number." },
        { status: 422 }
      );
    }

    data.order = parsed.value ?? 0;
  }

  if ("date" in b) {
    const parsed = parseOptionalDate(b.date);

    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Date must be a valid date/time." },
        { status: 422 }
      );
    }

    data.date = parsed.value;
  }

  if (
    "format" in b &&
    typeof b.format === "string" &&
    ["SOLO", "GROUP", "BOTH"].includes(b.format)
  ) {
    data.format = b.format;
  }

  if ("minTeam" in b) {
    const parsed = parseOptionalNumber(b.minTeam);

    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Min team size must be a valid number." },
        { status: 422 }
      );
    }

    data.minTeam = parsed.value;
  }

  if ("maxTeam" in b) {
    const parsed = parseOptionalNumber(b.maxTeam);

    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Max team size must be a valid number." },
        { status: 422 }
      );
    }

    data.maxTeam = parsed.value;
  }

  if ("feeSolo" in b) {
    const parsed = parseOptionalNumber(b.feeSolo);

    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Solo fee must be a valid number." },
        { status: 422 }
      );
    }

    data.feeSolo = parsed.value;
  }

  if ("feeGroup" in b) {
    const parsed = parseOptionalNumber(b.feeGroup);

    if (!parsed.ok) {
      return NextResponse.json(
        { error: "Group fee must be a valid number." },
        { status: 422 }
      );
    }

    data.feeGroup = parsed.value;
  }

  if ("registrationOpen" in b) {
    data.registrationOpen =
      b.registrationOpen === true ||
      b.registrationOpen === "true";
  }

  if ("questionsText" in b) {
    data.questionsText = b.questionsText || null;
  }

  try {
    const item = await prisma.competition.update({
      where: { id: params.id },
      data,
    });

    await audit(
      s.email,
      "competition.update",
      "Competition",
      params.id
    );

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error: any) {
    console.error("[admin/competitions/:id PATCH]", {
      id: params.id,
      body: b,
      error,
      message: error?.message,
      code: error?.code,
    });

    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Competition not found." },
        { status: 404 }
      );
    }

    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "A competition with that unique value already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || "Could not update competition.",
        code: error?.code,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const s = await requirePermission("content.manage");

  if (!s) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    await prisma.competition.delete({
      where: { id: params.id },
    });

    await audit(
      s.email,
      "competition.delete",
      "Competition",
      params.id
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[admin/competitions/:id DELETE]", {
      id: params.id,
      error,
    });

    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Competition not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Could not delete competition." },
      { status: 500 }
    );
  }
}
