import React from "react";
import { TopBar } from "./components/TopBar";
import { UploadScreen } from "./components/UploadScreen";
import { AnalyzingScreen } from "./components/AnalyzingScreen";
import { ResultsScreen } from "./components/ResultsScreen";
import { ReportScreen } from "./components/ReportScreen";
import { useAnalysis } from "./hooks/useAnalysis";

export default function App() {
  const {
    screen, setScreen,
    redlineFile, lrfFile, finalFiles,
    jobStatus, error, uploading, canRun,
    uploadRedline, uploadLrf, uploadFinalLabel, removeFinalFile,
    runAnalysis, reset,
  } = useAnalysis();

  const labels = jobStatus?.result ?? [];

  return (
    <div>
      <TopBar aiBadge="OpenAI gpt-4o" />
      <div className="layout">
        <nav className="sidebar">
          {[
            { id: "upload",   label: "Upload",  d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" },
            { id: "results",  label: "Results", d: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
            { id: "report",   label: "Report",  d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
          ].map((item) => (
            <button
              key={item.id}
              className={`nav-item${screen === item.id ? " active" : ""}`}
              onClick={() => {
                if (item.id === "upload") reset();
                else if (item.id === "results" && labels.length > 0) setScreen("results");
                else if (item.id === "report"  && labels.length > 0) setScreen("report");
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                {item.d.split("M").filter(Boolean).map((d, i) => (
                  <path key={i} d={"M" + d} />
                ))}
              </svg>
              <span className="nav-label">{item.label}</span>
              {screen === item.id && <div className="nav-dot" />}
            </button>
          ))}
        </nav>

        <main className="main">
          {screen === "upload" && (
            <UploadScreen
              redlineFile={redlineFile}
              lrfFile={lrfFile}
              finalFiles={finalFiles}
              uploading={uploading}
              canRun={canRun}
              error={error}
              onUploadRedline={uploadRedline}
              onUploadLrf={uploadLrf}
              onUploadFinal={uploadFinalLabel}
              onRemoveFinal={removeFinalFile}
              onRun={runAnalysis}
            />
          )}
          {screen === "analyzing" && <AnalyzingScreen status={jobStatus} />}
          {screen === "results" && labels.length > 0 && (
            <ResultsScreen
              labels={labels}
              onBack={reset}
              onReport={() => setScreen("report")}
              redlineFileId={redlineFile?.file_id ?? ""}
              finalFileIds={finalFiles.map(f => f.file_id)}
            />
          )}
          {screen === "report" && labels.length > 0 && (
            <ReportScreen labels={labels} onBack={() => setScreen("results")} />
          )}
        </main>
      </div>
    </div>
  );
}
