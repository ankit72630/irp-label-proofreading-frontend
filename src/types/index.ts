export type Outcome = "pass" | "fail" | "warn";

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ChangeResult {
  id: string;
  instruction: string;
  reason: string;
  outcome: Outcome;
  confidence: number;
  redline_bbox?: BoundingBox;
  final_bbox?: BoundingBox;
  ai_explanation?: string;
  group: string;
  redline_page?: number;
}

export interface LabelResult {
  label_id: string;
  filename: string;
  plm_title?: string;
  total_changes: number;
  passed: number;
  failed: number;
  warnings: number;
  changes: ChangeResult[];
}

export interface AnalysisStatus {
  job_id: string;
  status: "queued" | "extracting" | "ocr" | "ai_verify" | "locating" | "report" | "done" | "error";
  progress: number;
  message: string;
  started_at: string;
  completed_at?: string;
  result?: LabelResult[];
  error?: string;
}

export interface UploadedFile {
  file_id: string;
  filename: string;
  size_bytes: number;
  page_count?: number;
}
