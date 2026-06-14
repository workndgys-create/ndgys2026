"use client";

import { useEffect, useState } from "react";
import AdminShell, { Panel } from "@/components/admin/Shell";

type Me = {
  email: string;
  role: string;
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    fetch("/api/admin/me")
      .then(async (r) => {
        if (!r.ok) return;

        const data = await r.json();

        setMe({
          email: data.email,
          role: data.role,
        });
      })
      .catch(() => {});
  }, []);

  async function changePassword(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "/api/admin/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const body =
        await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          body.error ||
            "Could not change password."
        );

        return;
      }

      setMessage(
        "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell title="Profile">
      <Panel title="Account Information">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slatey">
              Email
            </p>

            <p className="font-600 text-ink">
              {me?.email || "Loading..."}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slatey">
              Role
            </p>

            <p className="font-600 text-ink">
              {me?.role?.replaceAll(
                "_",
                " "
              ) || "Loading..."}
            </p>
          </div>
        </div>
      </Panel>

      <div className="mt-5">
        <Panel title="Change Password">
          <form
            onSubmit={changePassword}
            className="space-y-4"
          >
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(
                  e.target.value
                )
              }
              required
              className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold"
            />

            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              required
              minLength={8}
              className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold"
            />

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              required
              minLength={8}
              className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-gold"
            />

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            {message && (
              <p className="text-sm text-green-600">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-midnight px-5 py-2 text-sm font-600 text-cream hover:bg-royal disabled:opacity-50"
            >
              {loading
                ? "Changing..."
                : "Change Password"}
            </button>
          </form>
        </Panel>
      </div>
    </AdminShell>
  );
}
