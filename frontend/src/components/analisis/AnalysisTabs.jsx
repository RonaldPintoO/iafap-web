import { ANALYSIS_TABS } from "./analysis.utils";

export default function AnalysisTabs({ tab, setTab }) {
  return (
    <div className="analysis-tabs">
      {ANALYSIS_TABS.map((item, index) => (
        <div key={item.id} className="analysis-tabs__item">
          <button
            type="button"
            className={`analysis-tab ${tab === item.id ? "is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {tab === item.id && <div className="analysis-tab__active-bar" />}
          </button>

          {index < ANALYSIS_TABS.length - 1 && (
            <div className="analysis-tab__divider" />
          )}
        </div>
      ))}
    </div>
  );
}