"use client";
import { useI18n } from "@/components/I18nProvider";
import type { PlaytimeBucket } from "@/lib/types";

const LEVEL: Record<PlaytimeBucket, 1 | 2 | 3> = { barely_touched: 1, some_hours: 2, sunk_50plus: 3 };

/** One-tap playtime gauge: three rising bars, filled to the level. Tapping cycles
 *  not set -> barely touched -> some hours -> 50+ hours -> not set (the backend owns the cycle). */
export default function Playtime({ bucket, onCycle }: { bucket: PlaytimeBucket | null; onCycle: () => void }) {
  const { t } = useI18n();
  const level = bucket ? LEVEL[bucket] : 0;
  const label = t("add.playtime", { bucket: t(bucket ? `library.bucket.${bucket}` : "library.bucket.none") });
  return (
    <button className="gauge-btn" onClick={onCycle} aria-label={label} title={label}>
      <span className={`gauge l${level}`} aria-hidden="true"><i /><i /><i /></span>
    </button>
  );
}
