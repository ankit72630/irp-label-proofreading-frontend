import React from "react";
import type { LabelResult } from "../types";

interface Props { labels: LabelResult[]; onBack: () => void; }

function OutcomeBadge({ outcome }: { outcome: string }) {
  const cls   = outcome === "pass" ? "ob-pass" : outcome === "fail" ? "ob-fail" : "ob-warn";
  const label = outcome === "pass" ? "PASSED"  : outcome === "fail" ? "FAILED"  : "WARNING";
  return <span className={`outcome-badge ${cls}`}>{label}</span>;
}

export function ReportScreen({ labels, onBack }: Props) {
  const total      = labels.reduce((s, l) => s + l.total_changes, 0);
  const passed     = labels.reduce((s, l) => s + l.passed,        0);
  const failed     = labels.reduce((s, l) => s + l.failed,        0);
  const warnings   = labels.reduce((s, l) => s + l.warnings,      0);
  const compliance = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="screen active" style={{ flexDirection:"column" }}>
      <div className="page-header">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding:"0 8px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
            </svg>
          </button>
          <div className="page-title">Compliance Report</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      <div className="report-layout">
        <div className="report-main">
          {/* Title row */}
          <div className="report-title-row">
            <div className="report-title">IRP Label Proofreading Report</div>
            <div className="report-date">
              {new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}
            </div>
          </div>
          <div style={{ fontSize:12, color:"var(--text3)", marginBottom:12 }}>
            Powered by <strong>OpenAI gpt-4o-mini</strong> (text) + <strong>gpt-4o</strong> (vision)
            · DePuy Synthes / J&J Label Compliance
          </div>

          {/* Stats row */}
          <div className="stats-row">
            {[
              { label:"Labels Checked",  val:labels.length,         color:"var(--text)"  },
              { label:"Total Changes",   val:total,                 color:"var(--text)"  },
              { label:"Passed",          val:passed,                color:"var(--pass)"  },
              { label:"Failed",          val:failed,                color:"var(--fail)"  },
              { label:"Warnings",        val:warnings,              color:"var(--warn)"  },
              { label:"Compliance",      val:`${compliance}%`,      color:compliance >= 80 ? "var(--pass)" : "var(--fail)" },
            ].map(s => (
              <div key={s.label} className="stat-cell">
                <span className="sc-label">{s.label}</span>
                <span className="sc-val" style={{ color:s.color }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Per-label blocks */}
          {labels.map((label) => {
            const grouped: Record<string, typeof label.changes> = {};
            label.changes.forEach(c => { (grouped[c.group] ||= []).push(c); });
            const lCompliance = label.total_changes > 0
              ? Math.round((label.passed / label.total_changes) * 100) : 0;

            return (
              <div key={label.label_id} className="label-block">
                <div className="label-hdr">
                  <div>
                    <div className="label-hdr-name">
                      {label.plm_title ?? label.filename}
                    </div>
                    <div className="label-hdr-stats">
                      {label.passed} passed · {label.failed} failed · {label.warnings} warnings
                    </div>
                  </div>
                  <div style={{ fontSize:18, fontWeight:800,
                    color: lCompliance >= 80 ? "rgba(255,255,255,0.9)" : "#FCA5A5" }}>
                    {lCompliance}%
                  </div>
                </div>
                <div className="changes-list">
                  {Object.entries(grouped).map(([group, changes]) => (
                    <div key={group}>
                      <div className="changes-section-hdr">{group}</div>
                      {changes.map(c => (
                        <div key={c.id} className={`change-row change-row-${c.outcome}`}>
                          <div style={{ flex:1 }}>
                            <div className="change-instr">{c.instruction}</div>
                            <div className="change-reason">
                              {c.ai_explanation ?? c.reason}
                            </div>
                            {c.redline_page && (
                              <div style={{ fontSize:10, color:"var(--text4)", marginTop:2 }}>
                                Redline page {c.redline_page}
                              </div>
                            )}
                          </div>
                          <div className="change-meta">
                            <span className="conf-txt" style={{
                              color: c.confidence >= 0.8 ? "var(--pass)"
                                   : c.confidence >= 0.6 ? "var(--warn)" : "var(--fail)",
                            }}>
                              {Math.round(c.confidence * 100)}%
                            </span>
                            <OutcomeBadge outcome={c.outcome} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Footer note */}
          <div style={{ marginTop:24, padding:"14px 18px", background:"var(--irp-pale)",
            border:"1px solid var(--irp-pale2)", borderRadius:10, fontSize:12, color:"var(--irp)" }}>
            <strong>AI Framework:</strong> Changes verified using <strong>OpenAI gpt-4o-mini</strong> for text
            comparison and <strong>gpt-4o vision</strong> for symbol/logo detection (Rx symbol, DePuy logo).
            Labels matched to Redline pages by PLM title (LCN-XXXXXXXXX_1).
            LRF data cross-referenced for descriptor validation.
          </div>
        </div>

        {/* Sidebar */}
        <div className="report-sidebar">
          <div style={{ padding:14, borderBottom:"1px solid var(--border)", fontSize:12, fontWeight:600 }}>
            Summary
          </div>
          <div style={{ padding:14, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:36, fontWeight:800,
                color: compliance >= 80 ? "var(--pass)" : "var(--fail)" }}>
                {compliance}%
              </div>
              <div style={{ fontSize:11, color:"var(--text3)" }}>Compliance Rate</div>
            </div>
            <div style={{ height:1, background:"var(--border)" }} />
            {[
              { label:"Labels",   val:labels.length, color:"var(--irp)"  },
              { label:"Passed",   val:passed,        color:"var(--pass)" },
              { label:"Failed",   val:failed,        color:"var(--fail)" },
              { label:"Warnings", val:warnings,      color:"var(--warn)" },
            ].map(s => (
              <div key={s.label} style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                <span style={{ color:"var(--text3)" }}>{s.label}</span>
                <span style={{ fontWeight:700, color:s.color }}>{s.val}</span>
              </div>
            ))}
            <div style={{ height:1, background:"var(--border)" }} />
            <div style={{ fontSize:10, color:"var(--text4)", lineHeight:1.5 }}>
              <div><strong>AI:</strong> gpt-4o-mini + gpt-4o</div>
              <div><strong>Matching:</strong> PLM title</div>
              <div><strong>Vision:</strong> Rx symbol, logos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
