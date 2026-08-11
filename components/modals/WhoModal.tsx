"use client";

import { useEffect, useRef } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { PeoplePicker } from "../SignInGate";
import { roleLb, TEAM_SIZE } from "@/lib/domain";
import { signOutAction } from "@/app/actions/auth";

export default function WhoModal() {
  const { user, isReadonly, isFull, closeModal } = useApp();
  // Signing in as someone else re-renders the server tree with a new `user`
  // prop; once it changes from who opened this modal, the switch succeeded
  // and the modal can close itself.
  const openedAs = useRef(user.name);
  useEffect(() => {
    if (user.name !== openedAs.current) closeModal();
  }, [user.name, closeModal]);

  return (
    <ModalShell title="Who is using the board" wide>
      <div className="modal-b">
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
        <div className="gate-card" style={{ boxShadow: "none", padding: 0 }}>
          <PeoplePicker currentName={user.name} />
        </div>
      </div>
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
