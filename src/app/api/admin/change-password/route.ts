import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { currentAdmin, audit } from "@/lib/adminSession";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const admin = await currentAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    const currentPassword =
      typeof body?.currentPassword === "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body?.newPassword === "string"
        ? body.newPassword
        : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 422 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            "New password must be at least 8 characters long.",
        },
        { status: 422 }
      );
    }

    const dbAdmin =
      await prisma.adminUser.findUnique({
        where: {
          email: admin.email,
        },
      });

    if (!dbAdmin) {
      return NextResponse.json(
        { error: "Admin not found." },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(
      currentPassword,
      dbAdmin.passwordHash
    );

    if (!valid) {
      return NextResponse.json(
        {
          error:
            "Current password is incorrect.",
        },
        { status: 400 }
      );
    }

    const passwordHash =
      await bcrypt.hash(newPassword, 12);

    await prisma.adminUser.update({
      where: {
        email: admin.email,
      },
      data: {
        passwordHash,
      },
    });

    await audit(
      admin.email,
      "admin.password.change",
      "AdminUser",
      dbAdmin.id,
      "Password changed"
    );

    return NextResponse.json({
      ok: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Something went wrong.",
      },
      { status: 500 }
    );
  }
}
