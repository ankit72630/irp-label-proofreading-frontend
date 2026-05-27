import { useState, useCallback, useRef } from "react";
import { api } from "../api/client";
import type { AnalysisStatus, UploadedFile } from "../types";

export type AppScreen = "upload" | "analyzing" | "results" | "report";

export function useAnalysis() {
  const [screen, setScreen] = useState<AppScreen>("upload");
  const [redlineFile, setRedlineFile] = useState<UploadedFile | null>(null);
  const [lrfFile, setLrfFile] = useState<UploadedFile | null>(null);       // NEW
  const [finalFiles, setFinalFiles] = useState<UploadedFile[]>([]);
  const [jobStatus, setJobStatus] = useState<AnalysisStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const uploadRedline = useCallback(async (file: File) => {
    setUploading(true); setError(null);
    try { setRedlineFile(await api.uploadRedline(file)); }
    catch (e: any) { setError(`Redline upload failed: ${e.message}`); }
    finally { setUploading(false); }
  }, []);

  const uploadLrf = useCallback(async (file: File) => {     // NEW
    setUploading(true); setError(null);
    try { setLrfFile(await api.uploadLrf(file)); }
    catch (e: any) { setError(`LRF upload failed: ${e.message}`); }
    finally { setUploading(false); }
  }, []);

  const uploadFinalLabel = useCallback(async (file: File) => {
    setUploading(true); setError(null);
    try {
      const result = await api.uploadFinalLabel(file);
      setFinalFiles((prev) => [...prev, result]);
    }
    catch (e: any) { setError(`Label upload failed: ${e.message}`); }
    finally { setUploading(false); }
  }, []);

  const removeFinalFile = useCallback((fileId: string) => {
    setFinalFiles((prev) => prev.filter((f) => f.file_id !== fileId));
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!redlineFile || finalFiles.length === 0) return;
    setError(null);
    setScreen("analyzing");
    try {
      const status = await api.startAnalysis(
        redlineFile.file_id,
        finalFiles.map((f) => f.file_id),
        lrfFile?.file_id,                    // optional LRF
      );
      setJobStatus(status);
      cleanupRef.current = api.streamStatus(
        status.job_id,
        (s) => setJobStatus(s),
        async () => {
          try {
            const full = await api.getReport(status.job_id);
            setJobStatus(full);
            setScreen("results");
          } catch (e: any) { setError(e.message); setScreen("upload"); }
        }
      );
    } catch (e: any) { setError(`Analysis failed: ${e.message}`); setScreen("upload"); }
  }, [redlineFile, lrfFile, finalFiles]);

  const reset = useCallback(() => {
    cleanupRef.current?.();
    setScreen("upload");
    setRedlineFile(null);
    setLrfFile(null);
    setFinalFiles([]);
    setJobStatus(null);
    setError(null);
  }, []);

  return {
    screen, setScreen,
    redlineFile, lrfFile, finalFiles,
    jobStatus, error, uploading,
    uploadRedline, uploadLrf, uploadFinalLabel, removeFinalFile,
    runAnalysis, reset,
    // Redline required + at least 1 final label. LRF is optional.
    canRun: !!redlineFile && finalFiles.length > 0 && !uploading,
  };
}