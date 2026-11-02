"use client";
import { useI18n } from "@/components/I18nProvider";

/** Placeholder rows while a list loads: keeps the layout still (designed "loading" state), no spinner over content. */
export default function SkeletonRows({ n = 3, grid = false }: { n?: number; grid?: boolean }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-busy="true" aria-label={t("common.loading")} className={grid ? "grid" : "stack"} style={{ marginTop: 16 }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card" style={{ display: "flex", gap: 14, alignItems: "center" }} aria-hidden="true">
          <span className="sk" style={{ width: 44, height: 58, borderRadius: 8, flex: "none" }} />
          <span style={{ flex: 1, display: "grid", gap: 8 }}>
            <span className="sk" style={{ height: 14, width: `${60 - (i % 3) * 8}%` }} />
            <span className="sk" style={{ height: 10, width: `${35 + (i % 2) * 6}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}
