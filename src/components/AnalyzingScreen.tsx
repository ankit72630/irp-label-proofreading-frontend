import React from "react";
import type { AnalysisStatus } from "../types";

const STEPS: { key: AnalysisStatus["status"]; label: string }[] = [
  { key: "extracting", label: "Extracting Redline pages & LRF data" },
  { key: "ocr",        label: "Extracting text from Final Labels" },
  { key: "ai_verify",  label: "AI verifying changes (gpt-4o-mini)" },
  { key: "locating",   label: "Matching labels to Redline pages" },
  { key: "report",     label: "Generating compliance report" },
];

const STATUS_ORDER = ["queued", "extracting", "ocr", "ai_verify", "locating", "report", "done"];

function stepState(stepKey: string, current: string): "done" | "active" | "pending" {
  const si = STATUS_ORDER.indexOf(stepKey);
  const ci = STATUS_ORDER.indexOf(current);
  return si < ci ? "done" : si === ci ? "active" : "pending";
}

interface Props { status: AnalysisStatus | null; }

export function AnalyzingScreen({ status }: Props) {
  const progress = status?.progress ?? 0;
  const current  = status?.status  ?? "queued";

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:24, padding:40 }}>
      <div className="spinner-ring" />
      <div style={{ textAlign:"center" }}>
        <div className="loading-title">Analysing label documents…</div>
        <div className="loading-sub" style={{ marginTop:4 }}>{status?.message ?? "Preparing…"}</div>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width:`${progress}%` }} />
      </div>
      <div className="loading-steps">
        {STEPS.map((s) => {
          const state = stepState(s.key, current);
          return (
            <div key={s.key} className={`loading-step ${state}`}>
              <div className="step-dot" />
              {s.label}
              {state === "done" && <span style={{ marginLeft:4, fontSize:10, color:"var(--pass)" }}>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
