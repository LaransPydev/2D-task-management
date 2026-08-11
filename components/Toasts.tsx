"use client";

import type { ToastItem } from "./app-context";

export default function Toasts({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div className={"toast " + t.kind} key={t.id}>
          <div>
            <b>{t.title}</b>
            {t.msg}
          </div>
        </div>
      ))}
    </div>
  );
}
