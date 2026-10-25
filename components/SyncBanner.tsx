"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { shouldPollSync, syncBanner } from "@/lib/feed";
import type { SyncStatus } from "@/lib/types";

const POLL_MS = 4000;

/** "Still syncing your library" banner. Polls GET /library/sync-status every few seconds while a
 *  sync is queued/running, stops otherwise, and calls onFinished once when it moves to done so the
 *  feed can refetch its (now richer) recommendations. Never blocks anything. */
export default function SyncBanner({ onFinished }: { onFinished?: () => void }) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const was = useRef<SyncStatus | null>(null);
  const finished = useRef(onFinished);
  finished.current = onFinished; // callers pass inline functions; keep the polling effect independent of their identity

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const s = (await api.syncStatus()).status;
        if (stopped) return;
        if (shouldPollSync(was.current) && s === "done") finished.current?.();
        was.current = s;
        setStatus(s);
        if (shouldPollSync(s)) timer = setTimeout(tick, POLL_MS);
      } catch { /* banner is optional; give up quietly */ }
    };
    tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, []);

  const b = syncBanner(status);
  if (!b.show) return null;
  return <div className={`banner ${b.tone}`} role="status">{b.text}</div>;
}
