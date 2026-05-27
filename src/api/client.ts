import type { AnalysisStatus, UploadedFile } from "../types";

const BASE = "http://localhost:8000/api";

interface BboxState {
  top: number; left: number; width: number; height: number;
}

async function upload(endpoint: string, file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/upload/${endpoint}`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  uploadRedline:    (file: File) => upload("redline", file),
  uploadLrf:        (file: File) => upload("lrf", file),
  uploadFinalLabel: (file: File) => upload("final-label", file),

  startAnalysis: async (
    redlineId: string,
    finalIds: string[],
    lrfId?: string,
  ): Promise<AnalysisStatus> => {
    const res = await fetch(`${BASE}/analysis/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        redline_file_id:      redlineId,
        lrf_file_id:          lrfId ?? null,
        final_label_file_ids: finalIds,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getStatus: async (jobId: string): Promise<AnalysisStatus> => {
    const res = await fetch(`${BASE}/analysis/status/${jobId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getReport: async (jobId: string): Promise<AnalysisStatus> => {
    const res = await fetch(`${BASE}/report/${jobId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  streamStatus: (
    jobId: string,
    onEvent: (s: AnalysisStatus) => void,
    onDone: () => void,
  ) => {
    const es = new EventSource(`${BASE}/analysis/stream/${jobId}`);
    es.onmessage = (e) => {
      const data: AnalysisStatus = JSON.parse(e.data);
      onEvent(data);
      if (data.status === "done" || data.status === "error") {
        es.close();
        onDone();
      }
    };
    es.onerror = () => { es.close(); onDone(); };
    return () => es.close();
  },

  checkHealth: async () => {
    const res = await fetch(`${BASE}/health`);
    return res.json();
  },

  getHighlightBbox: async (
    fileId: string,
    pageNum: number,
    instruction: string,
    side: string = "redline",
  ): Promise<{
    found: boolean;
    bbox: { top: number; left: number; width: number; height: number } | null;
    description: string;
  }> => {
    const params = new URLSearchParams({
      page_num:    String(pageNum),
      instruction,
      side,
    });
    const res = await fetch(
      `${BASE}/upload/${fileId}/highlight?${params}`,
      { method: "POST" },
    );
    if (!res.ok) return { found: false, bbox: null, description: "request failed" };
    return res.json();
  },
};