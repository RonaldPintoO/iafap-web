import React from "react";

export default function StatusPill({ status, getStatusStyle }) {
  const st = getStatusStyle(status);

  return (
    <div
      className="rent-card__status-pill"
      style={{ background: st.bg, color: st.color }}
    >
      {st.label}
    </div>
  );
}