import React from "react";

interface Props {
  aiBadge?: string;
}

export function TopBar({ aiBadge = "Local AI" }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        IRP <span>— Label Proofreading</span>
      </div>
      <div className="topbar-right">
        <span className="topbar-badge">{aiBadge}</span>
        <div className="avatar">IRP</div>
      </div>
    </header>
  );
}
