import React, { useState, useMemo, useEffect } from "react";
import { ChangeList } from "./ChangeList";
import type { ChangeResult, LabelResult } from "../types";
import { PdfCanvas } from "./PdfCanvas";

interface BboxState {
  top: number; left: number; width: number; height: number;
}

interface Props {
  labels: LabelResult[];
  onBack: () => void;
  onReport: () => void;
  redlineFileId: string;
  finalFileIds: string[];
}

export function ResultsScreen({ labels, onBack, onReport, redlineFileId, finalFileIds }: Props) {
  const [selected, setSelected] = useState<ChangeResult | null>(
    labels[0]?.changes[0] ?? null
  );
  const [zoom,        setZoom]        = useState(100);
  const [activeTab,   setActiveTab]   = useState<"side" | "redline" | "final">("side");
  

  const selectedLabel = useMemo(() =>
    labels.find(l => l.changes.some(c => c.id === selected?.id)) ?? labels[0],
  [labels, selected]);

  const total  = labels.reduce((s, l) => s + l.total_changes, 0);
  const passed = labels.reduce((s, l) => s + l.passed, 0);
  const failed = labels.reduce((s, l) => s + l.failed, 0);

  return (
    <div className="screen active" style={{ flexDirection:"column" }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="page-header" style={{ paddingBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding:"0 8px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
            </svg>
          </button>
          <div>
            <div className="page-title">Label Proofreading</div>
            <div className="page-subtitle">
              {labels.length} label{labels.length > 1 ? "s" : ""} ·{" "}
              {passed}/{total} changes passed ·{" "}
              {failed > 0
                ? <span style={{ color:"var(--fail)" }}>{failed} failed</span>
                : <span style={{ color:"var(--pass)" }}>all clear</span>}
            </div>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={onReport}>View Report</button>
          <button className="btn btn-primary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <div className="result-layout" style={{ flex:1 }}>
        <ChangeList
          labels={labels}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />

        <div className="result-right">

          {/* ── Toolbar ──────────────────────────────────────────────── */}
          <div className="preview-topbar">
            <div className="preview-tabs">
              {(["side","redline","final"] as const).map(t => (
                <button
                  key={t}
                  className={`ptab${activeTab === t ? " on" : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t === "side" ? "Side-by-Side" : t === "redline" ? "Redline" : "Final Label"}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {selected && (
                <div style={{
                  fontSize:11, padding:"3px 10px", borderRadius:6, fontWeight:600,
                  background: selected.outcome === "pass" ? "var(--pass-bg)"
                            : selected.outcome === "fail" ? "var(--fail-bg)" : "var(--warn-bg)",
                  color:      selected.outcome === "pass" ? "var(--pass)"
                            : selected.outcome === "fail" ? "var(--fail)" : "var(--warn)",
                }}>
                  {selected.outcome === "pass" ? "✓ PASSED"
                    : selected.outcome === "fail" ? "✗ FAILED" : "⚠ WARN"}
                </div>
              )}
              <div className="zoom-ctrl">
                <button className="zb" onClick={() => setZoom(z => Math.max(60, z - 10))}>−</button>
                <span className="zlabel">{zoom}%</span>
                <button className="zb" onClick={() => setZoom(z => Math.min(160, z + 10))}>+</button>
              </div>
            </div>
          </div>

          {/* ── PDF panels ───────────────────────────────────────────── */}
          <div className="pdf-grid" style={{
            flex:1,
            gridTemplateColumns: activeTab === "side" ? "1fr 1fr" : "1fr",
          }}>

            {/* Redline panel */}
            {(activeTab === "side" || activeTab === "redline") && (
              <div className="pdf-col">
                <div className="pdf-col-title">
                  Redline
                  <span className="pdf-col-sub">
                    {" · "}{selectedLabel?.plm_title ?? "original with markup"}
                  </span>
                </div>
                <div className="pdf-viewer">
                  <div className="pdf-scroll">
                    <PdfCanvas
                      fileId={redlineFileId}
                      pageNum={(selected?.redline_page ?? 1) - 1}
                      selected={selected}
                      side="redline"
                      
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Final Label panel */}
            {(activeTab === "side" || activeTab === "final") && (
              <div className="pdf-col">
                <div className="pdf-col-title">
                  Final Label
                  <span className="pdf-col-sub"> · updated version</span>
                </div>
                <div className="pdf-viewer">
                  <div className="pdf-scroll">
                    <PdfCanvas
                      fileId={
                        finalFileIds[labels.indexOf(selectedLabel!)] ?? finalFileIds[0]
                      }
                      pageNum={0}
                      selected={selected}
                      side="final"
                      
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Status bar ───────────────────────────────────────────── */}
          {selected && (
            <div className="preview-status">
              <strong>{selected.instruction}</strong>
              {" — "}
              {selected.ai_explanation ?? selected.reason ?? "No explanation"}
              {selected.redline_page && (
                <span style={{
                  marginLeft:8, fontSize:10, color:"var(--text4)",
                  background:"var(--bg)", padding:"1px 5px", borderRadius:4,
                }}>
                  Redline page {selected.redline_page}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bottom-bar">
        <button className="btn btn-outline" onClick={onBack}>New Analysis</button>
        <button className="btn btn-primary" onClick={onReport}>View Full Report →</button>
      </div>
    </div>
  );
}