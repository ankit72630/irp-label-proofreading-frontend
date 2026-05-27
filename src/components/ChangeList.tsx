import React, { useMemo, useState } from "react";
import type { ChangeResult, LabelResult } from "../types";

interface Props {
  labels: LabelResult[];
  selectedId: string | null;
  onSelect: (change: ChangeResult) => void;
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.8 ? "var(--pass)" : value >= 0.6 ? "var(--warn)" : "var(--fail)";
  return (
    <span style={{ fontSize:9, color, fontWeight:700, padding:"1px 5px", borderRadius:4,
      background: value >= 0.8 ? "var(--pass-bg)" : value >= 0.6 ? "var(--warn-bg)" : "var(--fail-bg)" }}>
      {pct}%
    </span>
  );
}

export function ChangeList({ labels, selectedId, onSelect }: Props) {
  const [activeLabel, setActiveLabel] = useState<string | null>(
    labels[0]?.label_id ?? null
  );

  const totalPassed  = labels.reduce((s, l) => s + l.passed,        0);
  const totalFailed  = labels.reduce((s, l) => s + l.failed,        0);
  const totalWarnings= labels.reduce((s, l) => s + l.warnings,      0);
  const total        = labels.reduce((s, l) => s + l.total_changes,  0);
  const compliance   = total > 0 ? Math.round((totalPassed / total) * 100) : 0;

  // For single-label view: show that label's changes grouped
  const currentLabel = labels.find(l => l.label_id === activeLabel) ?? labels[0];

  const grouped = useMemo(() => {
    if (!currentLabel) return {};
    const map: Record<string, ChangeResult[]> = {};
    currentLabel.changes.forEach(c => { (map[c.group] ||= []).push(c); });
    return map;
  }, [currentLabel]);

  return (
    <div className="result-left">
      {/* ── Summary header ── */}
      <div className="summary-header">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:13, fontWeight:600 }}>Proofreading Summary</div>
          <div style={{ fontSize:11, fontWeight:700,
            color: compliance >= 80 ? "var(--pass)" : "var(--fail)",
            background: compliance >= 80 ? "var(--pass-bg)" : "var(--fail-bg)",
            padding:"2px 8px", borderRadius:6 }}>
            {compliance}% compliant
          </div>
        </div>
        <div className="summary-stats">
          <div className="stat-pill stat-total"><div className="stat-val">{total}</div><div className="stat-label">Total</div></div>
          <div className="stat-pill stat-pass"><div className="stat-val">{totalPassed}</div><div className="stat-label">Passed</div></div>
          <div className="stat-pill stat-fail"><div className="stat-val">{totalFailed}</div><div className="stat-label">Failed</div></div>
          <div className="stat-pill stat-warn"><div className="stat-val">{totalWarnings}</div><div className="stat-label">Warn</div></div>
        </div>
      </div>

      {/* ── Label tabs (if multiple labels) ── */}
      {labels.length > 1 && (
        <div style={{ borderBottom:"1px solid var(--border)", display:"flex", overflowX:"auto" }}>
          {labels.map(l => (
            <button key={l.label_id}
              onClick={() => setActiveLabel(l.label_id)}
              style={{
                padding:"7px 12px", fontSize:11, fontWeight:600, border:"none", cursor:"pointer",
                whiteSpace:"nowrap", flexShrink:0,
                background: activeLabel === l.label_id ? "var(--irp-pale)" : "transparent",
                color:      activeLabel === l.label_id ? "var(--irp)" : "var(--text3)",
                borderBottom: activeLabel === l.label_id ? "2px solid var(--irp)" : "2px solid transparent",
              }}>
              {l.plm_title ?? l.filename}
              {l.failed > 0 && (
                <span style={{ marginLeft:4, background:"var(--fail)", color:"#fff",
                  fontSize:8, padding:"1px 4px", borderRadius:6 }}>{l.failed}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Current label PLM info ── */}
      {currentLabel?.plm_title && (
        <div style={{ padding:"8px 16px", background:"var(--irp-pale)", borderBottom:"1px solid var(--irp-pale2)",
          fontSize:11, color:"var(--irp)", fontWeight:500 }}>
          📋 {currentLabel.plm_title}
          <span style={{ marginLeft:8, color:"var(--text4)", fontWeight:400 }}>
            {currentLabel.total_changes} changes · Redline matched by PLM title
          </span>
        </div>
      )}

      {/* ── Changes grouped by category ── */}
      <div className="group-wrap">
        {Object.entries(grouped).map(([group, changes]) => {
          const gPass = changes.filter(c => c.outcome === "pass").length;
          const gFail = changes.filter(c => c.outcome === "fail").length;
          const gWarn = changes.filter(c => c.outcome === "warn").length;
          const gid = `grp-${group}-${currentLabel?.label_id}`;
          return (
            <div key={group}>
              <div className="group-hdr" onClick={() => {
                const body = document.getElementById(gid + "-body");
                const chev = document.getElementById(gid + "-chev");
                if (body) body.style.display = body.style.display === "none" ? "block" : "none";
                if (chev) chev.classList.toggle("open");
              }}>
                <div className="group-name">
                  <span id={gid + "-chev"} className="group-chevron open">›</span>
                  {group}
                </div>
                <div className="group-badges">
                  {gPass > 0 && <span className="gbadge gbp">{gPass}✓</span>}
                  {gFail > 0 && <span className="gbadge gbf">{gFail}✗</span>}
                  {gWarn > 0 && <span className="gbadge gbw">{gWarn}⚠</span>}
                </div>
              </div>
              <div id={gid + "-body"}>
                {changes.map((c, i) => (
                  <div key={c.id}
                    className={`chk-item${
                      selectedId === c.id
                        ? c.outcome === "fail" ? " selected-fail" : " selected"
                        : ""
                    }`}
                    onClick={() => onSelect(c)}>
                    <div className={`chk-num cn-${c.outcome}`}>{i + 1}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="chk-text">{c.instruction}</div>
                      <div className="chk-conf" style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
                        <ConfidencePill value={c.confidence} />
                        {c.redline_page && (
                          <span style={{ fontSize:9, color:"var(--text4)", background:"var(--bg)",
                            padding:"1px 5px", borderRadius:4 }}>
                            pg {c.redline_page}
                          </span>
                        )}
                        {c.reason && (
                          <span style={{ fontSize:9, color:"var(--text4)", overflow:"hidden",
                            textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120 }}>
                            {c.reason}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`chk-icon ci-${c.outcome}`}>
                      {c.outcome === "pass" ? "✓" : c.outcome === "fail" ? "✗" : "⚠"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="summary-footer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={11} height={11}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Click any change to highlight it in both PDFs
      </div>
    </div>
  );
}
