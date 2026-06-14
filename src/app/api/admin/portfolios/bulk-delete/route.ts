import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const admin = await requirePermission("allocations.manage");

  if (!admin) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const b = await req.json().catch(() => null);

  const ids = Array.isArray(b?.ids)
    ? (b.ids as string[])
    : [];

  const names = Array.isArray(b?.names)
    ? (b.names as string[])
    : [];

  const trackSlug =
    typeof b?.trackSlug === "string"
      ? b.trackSlug
      : undefined;

  try {
    // Delete by IDs
    if (ids.length > 0) {
      const result = await prisma.portfolio.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      console.log("Deleted:", result.count);

      await audit(
        admin.email,
        "portfolio.bulk.delete",
        "Portfolio",
        undefined,
        JSON.stringify({ ids })
      );

      return NextResponse.json({
        ok: true,
        count: result.count,
      });
    }

    // Delete by names + committee
    if (names.length > 0 && trackSlug) {
      const normalized = Array.from(
        new Set(
          names
            .map((n) => n.toString().trim())
            .filter(Boolean)
        )
      );

      if (normalized.length === 0) {
        return NextResponse.json(
          { error: "No names provided" },
          { status: 422 }
        );
      }

      const orClauses = normalized.flatMap((n) => [
        {
          name: {
            equals: n,
            mode: "insensitive" as const,
          },
        },
        {
          name: {
            contains: n,
            mode: "insensitive" as const,
          },
        },
      ]);

      const matched = await prisma.portfolio.findMany({
        where: {
          trackSlug,
          OR: orClauses,
        },
        select: {
          id: true,
          name: true,
        },
      });

      const matchedNames = matched.map((m) =>
        m.name.toLowerCase()
      );

      const notFound = normalized.filter(
        (n) =>
          !matchedNames.includes(n.toLowerCase())
      );

      if (matched.length > 0) {
        const idsToDelete = matched.map(
          (m) => m.id
        );

        await prisma.portfolio.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });
      }

      await audit(
        admin.email,
        "portfolio.bulk.deleteByName",
        "Portfolio",
        undefined,
        JSON.stringify({
          trackSlug,
          deleted: matched.map((m) => m.name),
          notFound,
        })
      );

      return NextResponse.json({
        ok: true,
        deleted: matched.length,
        notFound,
        requested: normalized.length,
      });
    }

    return NextResponse.json(
      { error: "No ids or names provided" },
      { status: 422 }
    );
  } catch (err) {
    console.error(
      "[admin/portfolios/bulk-delete]",
      err
    );

    return NextResponse.json(
      { error: "Failed to delete portfolios" },
      { status: 500 }
    );
  }
}
