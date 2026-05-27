import React, { useCallback, useState } from "react";
import type { UploadedFile } from "../types";

interface Props {
  label: string;
  subtitle: string;
  multiple?: boolean;
  uploadedFiles: UploadedFile[];
  onFileSelected: (file: File) => void;
  onRemove?: (fileId: string) => void;
  uploading?: boolean;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function DropZone({ label, subtitle, multiple, uploadedFiles, onFileSelected, onRemove, uploading }: Props) {
  const [over, setOver] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
        onFileSelected(f);
      }
    });
  }, [onFileSelected]);

  return (
    <div>
      <div
        className={`drop-zone${over ? " over" : ""}${uploadedFiles.length > 0 ? " has-file" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <input
          type="file"
          className="drop-input"
          accept=".pdf"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="drop-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div className="drop-title">{label}</div>
        <div className="drop-sub">{subtitle}</div>
        {uploading && <div className="drop-sub" style={{ color: "var(--irp)", marginTop: 6 }}>Uploading…</div>}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="multi-upload-list" style={{ marginTop: 8 }}>
          {uploadedFiles.map((f) => (
            <div key={f.file_id} className="file-chip">
              <div className="file-chip-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div className="file-chip-name">{f.filename}</div>
                <div className="file-chip-size">
                  {f.page_count ? `${f.page_count} page${f.page_count !== 1 ? "s" : ""} · ` : ""}
                  {formatBytes(f.size_bytes)}
                </div>
              </div>
              {onRemove && (
                <button className="file-chip-remove" onClick={() => onRemove(f.file_id)}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
