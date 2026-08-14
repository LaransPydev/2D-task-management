"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { roleLb, TEAM_SIZE } from "@/lib/domain";
import { signOutAction, updateOwnAccountAction } from "@/app/actions/auth";
import PasswordInput from "../PasswordInput";

export default function WhoModal() {
  const { user, isReadonly, isFull, closeModal, refresh, toast } = useApp();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast("Failed", "New passwords do not match.", "bad");
      return;
    }
    setBusy(true);
    try {
      await updateOwnAccountAction({ name, currentPassword, newPassword });
      await refresh();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Done", "Your account was updated.", "ok");
      router.refresh();
    } catch (error) {
      toast("Failed", error instanceof Error ? error.message : String(error), "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Who is using the board" wide>
      {isReadonly && (
        <div className="modal-b">
          <div className="callout">
            <div>
              <b>You are signed in with the Visitor account.</b>
              <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
                You can view all projects and reports, but you cannot create, edit, move, comment on, or delete anything. To make changes, sign out and sign in with your own account.
              </p>
            </div>
          </div>
        </div>
      )}
      {!isReadonly && <div className="modal-b">
        <div className="callout">
          <div>
            Signed in as <b>{user.name}</b> — {roleLb(user.role)}.{" "}
            {isReadonly
              ? "Read-only. Every project, log, chat and chart is open to you; no button will change anything."
              : isFull
                ? "Full control: you can move any project through any gate, edit anything, and delete projects."
                : "You can act on your own gate, on your own projects. Everything else is read-only for you."}{" "}
            Every action is written to the shared database under this name — {TEAM_SIZE} people share this board.
          </div>
        </div>
        <form onSubmit={saveAccount} style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <h4 style={{ fontSize: 13, margin: 0 }}>My account</h4>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            Display name
            <input
              disabled={busy}
              maxLength={60}
              minLength={2}
              onChange={(e) => setName(e.target.value)}
              required
              value={name}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            Current password
            <PasswordInput
              autoComplete="current-password"
              disabled={busy}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              value={currentPassword}
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              New password (optional)
              <PasswordInput
                autoComplete="new-password"
                disabled={busy}
                minLength={6}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                value={newPassword}
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              Confirm new password
              <PasswordInput
                autoComplete="new-password"
                disabled={busy || !newPassword}
                minLength={6}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={Boolean(newPassword)}
                value={confirmPassword}
              />
            </label>
          </div>
          <div>
            <button className="btn pri" disabled={busy || !currentPassword || (newPassword.length > 0 && newPassword.length < 6)} type="submit">
              {busy ? "Saving…" : "Save my account"}
            </button>
          </div>
        </form>
      </div>}
      <div className="modal-f">
        <form action={signOutAction}>
          <button type="submit" className="btn gh">
            Sign out
          </button>
        </form>
        <button className="btn" onClick={closeModal}>
          Close
        </button>
      </div>
    </ModalShell>
  );
}
