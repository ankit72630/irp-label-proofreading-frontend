import React from "react";
import { DropZone } from "./DropZone";
import type { UploadedFile } from "../types";

interface Props {
  redlineFile: UploadedFile | null;
  lrfFile: UploadedFile | null;
  finalFiles: UploadedFile[];
  uploading: boolean;
  canRun: boolean;
  error: string | null;
  onUploadRedline: (f: File) => void;
  onUploadLrf: (f: File) => void;
  onUploadFinal: (f: File) => void;
  onRemoveFinal: (id: string) => void;
  onRun: () => void;
}

export function UploadScreen({
  redlineFile, lrfFile, finalFiles, uploading, canRun, error,
  onUploadRedline, onUploadLrf, onUploadFinal, onRemoveFinal, onRun,
}: Props) {
  return (
    <div className="screen active" style={{ flexDirection: "column" }}>
      <div className="page-header">
        <div>
          <div className="page-title">Label Proofreading</div>
          <div className="page-subtitle">Upload Redline · LRF · Final Labels — AI verifies every change</div>
        </div>
      </div>

      {error && (
        <div style={{ margin: "12px 28px 0", padding: "10px 14px", background: "var(--fail-bg)", border: "1px solid var(--fail-border)", borderRadius: 8, fontSize: 13, color: "var(--fail)" }}>
          {error}
        </div>
      )}

      <div className="upload-layout">
        <div className="upload-left">

          {/* ── Row 1: Redline + LRF side by side ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Redline — exactly 1 PDF */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span style={{ background: "var(--irp)", color: "#fff", borderRadius: 4, padding: "1px 7px", fontSize: 10, marginRight: 7, fontWeight: 700 }}>1</span>
                  Redline Document
                </div>
                <span style={{ fontSize: 10, color: "var(--text4)" }}>1 PDF · multi-page</span>
              </div>
              <div className="card-body">
                <DropZone
                  label="Drop Redline PDF here"
                  subtitle="1 page per label — numbered changes at top of each page"
                  uploadedFiles={redlineFile ? [redlineFile] : []}
                  onFileSelected={onUploadRedline}
                  uploading={uploading && !redlineFile}
                />
              </div>
            </div>

            {/* LRF — exactly 1 PDF, optional */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span style={{ background: "var(--warn)", color: "#fff", borderRadius: 4, padding: "1px 7px", fontSize: 10, marginRight: 7, fontWeight: 700 }}>2</span>
                  Label Request Form
                  <span style={{ marginLeft: 8, fontSize: 10, color: "var(--text4)", fontWeight: 400 }}>optional</span>
                </div>
                <span style={{ fontSize: 10, color: "var(--text4)" }}>1 PDF · LRF reference</span>
              </div>
              <div className="card-body">
                <DropZone
                  label="Drop LRF PDF here"
                  subtitle="Provides correct descriptors for AI cross-validation"
                  uploadedFiles={lrfFile ? [lrfFile] : []}
                  onFileSelected={onUploadLrf}
                  uploading={false}
                />
                {!lrfFile && (
                  <div style={{ marginTop: 8, fontSize: 10, color: "var(--text4)", textAlign: "center" }}>
                    Without LRF, descriptor changes (Change 3) use redline text only
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Row 2: Final Labels — bulk ── */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span style={{ background: "var(--pass)", color: "#fff", borderRadius: 4, padding: "1px 7px", fontSize: 10, marginRight: 7, fontWeight: 700 }}>3</span>
                Final Label PDFs
              </div>
              <span style={{ fontSize: 10, color: "var(--text4)" }}>
                Bulk — {finalFiles.length > 0 ? `${finalFiles.length} file${finalFiles.length > 1 ? "s" : ""} uploaded` : "add as many as needed"}
              </span>
            </div>
            <div className="card-body">
              <DropZone
                label="Drop Final Label PDFs here"
                subtitle="One PDF per label (e.g. Final_label-1.pdf, Final_label-2.pdf…) — no limit"
                multiple
                uploadedFiles={finalFiles}
                onFileSelected={onUploadFinal}
                onRemove={onRemoveFinal}
                uploading={uploading && !!redlineFile}
              />
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="upload-right">
          <div className="card">
            <div className="card-header"><div className="card-title">How it works</div></div>
            <div className="card-body" style={{ padding: "12px 16px" }}>
              {[
                ["Upload Redline", "Multi-page PDF — numbered changes per label page"],
                ["Upload LRF", "Optional — DePuy Label Request Form for descriptor validation"],
                ["Upload Final Labels", "Bulk — one PDF per label, any quantity"],
                ["AI Matches Labels", "PLM title matching: LCN-299967042_1 → page 1 of Redline"],
                ["Change Verification", "gpt-4o-mini checks text · gpt-4o vision checks Rx symbol"],
                ["Review & Export", "Click any change to highlight in both PDFs, export PDF report"],
              ].map(([title, desc], i) => (
                <div key={i} className="process-step">
                  <div className="step-num">{i + 1}</div>
                  <div className="step-text"><strong>{title}</strong> — {desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload status summary */}
          <div className="card">
            <div className="card-header"><div className="card-title">Upload Status</div></div>
            <div className="card-body" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Redline", file: redlineFile, required: true },
                { label: "LRF", file: lrfFile, required: false },
                { label: `Final Labels (${finalFiles.length})`, file: finalFiles[0] ?? null, required: true },
              ].map(({ label, file, required }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text2)" }}>{label}{required ? "" : " (optional)"}</span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                    ...(file
                      ? { background: "var(--pass-bg)", color: "var(--pass)", border: "1px solid var(--pass-border)" }
                      : required
                        ? { background: "var(--fail-bg)", color: "var(--fail)", border: "1px solid var(--fail-border)" }
                        : { background: "var(--warn-bg)", color: "var(--warn)", border: "1px solid var(--warn-border)" }
                    )
                  }}>
                    {file ? "✓ Ready" : required ? "Required" : "Optional"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <button
          className="btn btn-primary btn-lg"
          disabled={!canRun}
          onClick={onRun}
          style={!canRun ? { opacity: 0.4, cursor: "not-allowed" } : {}}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
            <polygon points="5,3 19,12 5,21 5,3"/>
          </svg>
          Run Proofreading Analysis
        </button>
      </div>
    </div>
  );
}
