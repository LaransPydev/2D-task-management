"use client";

import { createContext, useContext } from "react";
import type { CommentRow, EventRow, ProjectRow, SessionUser } from "@/lib/domain";
import type { UserSummary } from "@/lib/data";

export interface Filters {
  q: string;
  designer: string;
  dtype: string;
  market: string;
  stage: string;
  month: string;
  flag: string;
}
export const EMPTY_FILTERS: Filters = { q: "", designer: "", dtype: "", market: "", stage: "", month: "", flag: "" };

export type ViewName = "pipeline" | "board" | "perf" | "attn";
export type ToastKind = "" | "ok" | "bad";
export interface ToastItem {
  id: string;
  title: string;
  msg: string;
  kind: ToastKind;
}

export type ModalState =
  | { kind: "new" }
  | { kind: "move"; projectId: string; to: string }
  | { kind: "block"; projectId: string }
  | { kind: "edit"; projectId: string }
  | { kind: "who" }
  | { kind: "del"; projectId: string }
  | { kind: "wipe" }
  | { kind: "designers" }
  | { kind: "dtypes" }
  | { kind: "mktypes" }
  | { kind: "roster" }
  | null;

export interface AppCtx {
  user: SessionUser;
  isReadonly: boolean;
  isFull: boolean;
  projects: ProjectRow[];
  events: EventRow[];
  comments: CommentRow[];
  designers: string[];
  users: UserSummary[];
  dbDtypes: string[];
  dbMarkets: string[];
  connError: string | null;
  lastSync: number | null;

  refresh: () => Promise<void>;
  toast: (title: string, msg: string, kind?: ToastKind) => void;

  view: ViewName;
  setView: (v: ViewName) => void;

  open: Set<string>;
  toggleOpen: (id: string) => void;
  isOpen: (id: string) => boolean;
  setManyOpen: (ids: string[], val: boolean) => void;

  dtab: Record<string, string>;
  setDtab: (id: string, tab: string) => void;

  filters: Filters;
  setFilter: (k: keyof Filters, v: string) => void;

  amonth: string | null;
  setAmonth: (m: string) => void;

  modal: ModalState;
  openModal: (m: ModalState) => void;
  closeModal: () => void;

  gotoProject: (id: string) => void;
}

export const AppContext = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp() must be used within <AppProvider>.");
  return ctx;
}
