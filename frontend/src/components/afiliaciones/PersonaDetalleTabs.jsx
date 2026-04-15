import { Fragment } from "react";

const DEFAULT_TABS = [
  { value: "datos", label: "Datos" },
  { value: "vinculos", label: "Vínculos" },
  { value: "acciones", label: "Acciones" },
  { value: "bps", label: "BPS" },
  { value: "formulario", label: "Formulario" },
];

export default function PersonaDetalleTabs({
  value,
  onChange,
  tabs = DEFAULT_TABS,
  className = "afi-detail-tabs",
  tabClassName = "afi-detail-tab",
  dividerClassName = "afi-detail-tab-divider",
}) {
  return (
    <div className={className}>
      {tabs.map((tab, index) => (
        <Fragment key={tab.value}>
          <button
            type="button"
            className={`${tabClassName} ${value === tab.value ? "is-active" : ""}`}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>

          {index < tabs.length - 1 && <div className={dividerClassName} />}
        </Fragment>
      ))}
    </div>
  );
}