"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { AppContext, EMPTY_FILTERS, type AppCtx, type Filters, type ModalState, type ToastItem, type ToastKind, type ViewName } from "./app-context";
import type { BoardData } from "@/lib/data";
import { isFull as computeFull, isReadonly as computeReadonly, type SessionUser } from "@/lib/domain";
import { attnRed } from "@/lib/analytics";
import { logViewAction } from "@/app/actions/board";
import TopBar from "./TopBar";
import ModeStrip from "./ModeStrip";
import PipelineView from "./views/PipelineView";
import BoardView from "./views/BoardView";
import PerfView from "./views/PerfView";
import AttnView from "./views/AttnView";
import ModalRoot from "./modals/ModalRoot";
import Toasts from "./Toasts";

const POLL_MS = 0; // polling disabled — manual refresh only

async function fetcher(url: string): Promise<BoardData> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export default function App({ user, initialBoard }: { user: SessionUser; initialBoard: BoardData }) {
  // lastSync is set from SWR's onSuccess callback (a fetch-lifecycle callback,
  // not render or an effect body) so the "last checked" clock never reads as
  // render-phase state derived from the current time.
  const [lastSync, setLastSync] = useState<number | null>(null);
  const { data, error, mutate, isValidating } = useSWR<BoardData>("/api/board", fetcher, {
    fallbackData: initialBoard,
    refreshInterval: POLL_MS,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 1500,
    onSuccess: () => setLastSync(Date.now()),
  });

  const [view, setView] = useState<ViewName>("pipeline");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [dtab, setDtabState] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  // null = "no explicit pick yet"; the Performance view falls back to the
  // current month wherever it reads this (see amonth ?? monthKey(new Date())
  // below) rather than syncing a default in from an effect.
  const [amonth, setAmonth] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeq = useRef(0);

  const toast = useCallback((title: string, msg: string, kind: ToastKind = "") => {
    const id = "t" + ++toastSeq.current;
    setToasts((t) => [...t, { id, title, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const toggleOpen = useCallback((id: string) => {
    const isOpening = !open.has(id);
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (isOpening) logViewAction(id).catch(() => {});
  }, [open]);
  const isOpen = useCallback((id: string) => open.has(id), [open]);
  const setManyOpen = useCallback((ids: string[], val: boolean) => {
    setOpen((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (val ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);
  const setDtab = useCallback((id: string, tab: string) => {
    setDtabState((prev) => ({ ...prev, [id]: tab }));
  }, []);
  const setFilter = useCallback((k: keyof Filters, v: string) => {
    setFilters((prev) => ({ ...prev, [k]: v }));
  }, []);
  const openModal = useCallback((m: ModalState) => setModal(m), []);
  const closeModal = useCallback(() => setModal(null), []);

  const gotoProject = useCallback((id: string) => {
    setView("pipeline");
    setFilters((prev) => ({ ...prev, flag: "", stage: "" }));
    setOpen((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.querySelector(`[data-p="${id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          (el as HTMLElement).style.transition = "box-shadow .4s";
          (el as HTMLElement).style.boxShadow = "0 0 0 2px var(--acc)";
          setTimeout(() => ((el as HTMLElement).style.boxShadow = ""), 1400);
        }
      }, 60);
    });
  }, []);

  const projects = data?.projects ?? initialBoard.projects;
  const events = data?.events ?? initialBoard.events;
  const comments = data?.comments ?? initialBoard.comments;
  const designers = data?.designers ?? initialBoard.designers ?? [];
  const dbDtypes = data?.dbDtypes ?? initialBoard.dbDtypes ?? [];
  const dbMarkets = data?.dbMarkets ?? initialBoard.dbMarkets ?? [];

  const ctx: AppCtx = useMemo(
    () => ({
      user,
      isReadonly: computeReadonly(user),
      isFull: computeFull(user),
      projects,
      events,
      comments,
      designers,
      dbDtypes,
      dbMarkets,
      connError: error ? error.message : null,
      lastSync,
      refresh,
      toast,
      view,
      setView,
      open,
      toggleOpen,
      isOpen,
      setManyOpen,
      dtab,
      setDtab,
      filters,
      setFilter,
      amonth,
      setAmonth,
      modal,
      openModal,
      closeModal,
      gotoProject,
    }),
    [
      user,
      projects,
      events,
      comments,
      designers,
      dbDtypes,
      dbMarkets,
      error,
      lastSync,
      refresh,
      toast,
      view,
      open,
      toggleOpen,
      isOpen,
      setManyOpen,
      dtab,
      setDtab,
      filters,
      setFilter,
      amonth,
      modal,
      openModal,
      closeModal,
      gotoProject,
    ],
  );

  const activeCount = projects.filter((p) => p.stage !== "done").length;
  const attnCount = attnRed(projects);

  return (
    <AppContext.Provider value={ctx}>
      <TopBar activeCount={activeCount} attnCount={attnCount} isValidating={isValidating} />
      <ModeStrip />
      <div className="wrap">
        {view === "pipeline" && <PipelineView />}
        {view === "board" && <BoardView />}
        {view === "perf" && <PerfView />}
        {view === "attn" && <AttnView />}
      </div>
      {/* <div className="foot">
        Sportstech Creative Ops · 12-stage Amazon creative pipeline · live database ·{" "}
        {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
      </div> */}
      <ModalRoot />
      <Toasts toasts={toasts} />
    </AppContext.Provider>
  );
}
