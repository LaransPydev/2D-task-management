"use client";

import { useRef, useState } from "react";
import { ago, avColor, ballWith, initials, roleLb, type CommentRow, type ProjectRow } from "@/lib/domain";
import { commentAction } from "@/app/actions/board";
import { useApp } from "../app-context";

const MENTION_RE = /@([A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)?)/g;

function MentionText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE);
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span className="mention" key={i++}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const QUICK_QUESTIONS = ["What is the status right now?", "Why is this pending?", "When will this be ready?", "Please prioritise this one.", "Who is blocking this?"];

export default function ChatPane({ p, comments }: { p: ProjectRow; comments: CommentRow[] }) {
  const { user, isReadonly, toast, refresh } = useApp();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function send(value: string) {
    const t = value.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await commentAction({ projectId: p.id, text: t });
      setText("");
      await refresh();
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    } catch (e) {
      toast("Send failed", e instanceof Error ? e.message : String(e), "bad");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="chat" ref={listRef}>
        {comments.length ? (
          comments.map((c) => (
            <div className={"msg" + (c.actor === user.name ? " mine" : "")} key={c.id}>
              <i className="av" style={{ background: avColor(c.actor) }} title={c.actor}>
                {initials(c.actor)}
              </i>
              <div className="bub">
                <div className="mh">
                  <b>{c.actor}</b>
                  <span>
                    {roleLb(c.actorRole)} · {ago(c.at)}
                  </span>
                </div>
                <div className="mt">
                  <MentionText text={c.text} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx-3)" }}>
            No messages yet. Ask the owner directly here — it stays attached to this project.
          </p>
        )}
      </div>
      {isReadonly ? (
        <p className="hintline" style={{ margin: "13px 0 0", paddingTop: 13, borderTop: "1px solid var(--line)" }}>
          Visitors can read the thread but not post. Sign in as yourself to ask a question here.
        </p>
      ) : (
        <>
          <div className="askbar">
            <textarea
              placeholder={`Ask ${ballWith(p).name} something… use @name to point at someone`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(text);
                }
              }}
            />
            <button className="btn pri" disabled={sending} onClick={() => send(text)}>
              Send
            </button>
          </div>
          <div className="quickq">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q} onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
