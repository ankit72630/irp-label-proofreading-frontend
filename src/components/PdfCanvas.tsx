import React, { useState, useEffect } from "react";
import type { ChangeResult } from "../types";
import { api } from "../api/client";

const BASE = "http://localhost:8000/api";

const HIGHLIGHT_COLORS = {
  pass: { fill: "rgba(16,185,129,0.25)", stroke: "#10B981", label: "#10B981" },
  fail: { fill: "rgba(220,38,38,0.22)",  stroke: "#EF4444", label: "#EF4444" },
  warn: { fill: "rgba(245,158,11,0.22)", stroke: "#F59E0B", label: "#F59E0B" },
};

interface BboxState {
  top: number; left: number; width: number; height: number;
}

interface Props {
  fileId: string;
  pageNum: number;
  selected: ChangeResult | null;
  side: "redline" | "final";
}

export function PdfCanvas({ fileId, pageNum, selected, side }: Props) {
  const [loaded,    setLoaded]    = useState(false);
  const [error,     setError]     = useState(false);
  const [bbox,      setBbox]      = useState<BboxState | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Reset image when file or page changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
    setBbox(null);
  }, [fileId, pageNum]);

  // Fetch bbox independently per side — no hint passing
  useEffect(() => {
    setBbox(null);
    if (!selected || !fileId) return;

    const existingBbox = side === "redline"
      ? selected.redline_bbox
      : selected.final_bbox;

    if (existingBbox) {
      setBbox(existingBbox);
      return;
    }

    const timer = setTimeout(() => {
      setDetecting(true);
      api.getHighlightBbox(fileId, pageNum, selected.instruction, side)
        .then((result) => {
          if (result.found && result.bbox) setBbox(result.bbox);
        })
        .catch(() => {})
        .finally(() => setDetecting(false));
    }, 200);

    return () => clearTimeout(timer);

  }, [selected?.id, fileId, pageNum, side]);

  if (!fileId) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:300, color:"var(--text3)", fontSize:13 }}>
      No file uploaded
    </div>
  );

  const src = `${BASE}/upload/${fileId}/page/${pageNum}?t=${fileId}`;
  const colors = selected ? HIGHLIGHT_COLORS[selected.outcome] : null;
  const tag = side === "redline"
    ? (selected?.outcome === "pass" ? "Original"   : "Issue here")
    : (selected?.outcome === "pass" ? "✓ Applied"  : "✗ Not applied");

  return (
    <div style={{ position:"relative", width:"100%" }}>
      {!loaded && !error && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
          height:300, color:"var(--text3)", fontSize:13 }}>
          Loading PDF…
        </div>
      )}
      {error && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
          height:300, color:"var(--fail)", fontSize:13 }}>
          Could not load PDF page
        </div>
      )}
      <img
        src={src}
        alt={`${side} PDF page ${pageNum + 1}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ width:"100%", height:"auto", display: loaded ? "block" : "none" }}
      />
      {loaded && detecting && (
        <div style={{
          position:"absolute", top:8, right:8,
          background:"rgba(0,0,0,0.65)", color:"#fff",
          fontSize:11, padding:"4px 10px", borderRadius:6,
          display:"flex", alignItems:"center", gap:6,
        }}>
          <div style={{
            width:8, height:8, borderRadius:"50%",
            border:"2px solid #fff", borderTopColor:"transparent",
            animation:"spin 0.7s linear infinite",
          }} />
          Finding location…
        </div>
      )}
      {loaded && bbox && colors && (
        <div style={{
          position:"absolute",
          top:`${bbox.top * 100}%`, left:`${bbox.left * 100}%`,
          width:`${bbox.width * 100}%`, height:`${bbox.height * 100}%`,
          background:colors.fill, border:`2.5px solid ${colors.stroke}`,
          borderRadius:3, pointerEvents:"none", transition:"all 0.3s ease",
        }}>
          <div style={{
            position:"absolute", top:-24, left:0,
            background:colors.label, color:"#fff",
            fontSize:10, fontWeight:700, padding:"3px 8px",
            borderRadius:4, whiteSpace:"nowrap",
            boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
          }}>
            {tag}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}