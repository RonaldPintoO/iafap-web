import { useMemo, useState } from "react";
import ActivityTabs from "../components/actividad/ActivityTabs";
import ActivityRow from "../components/actividad/ActivityRow";
import {
  ROWS,
  onlyDigits,
  createEmptyRows,
  isCedulaValid,
  isFechaValid,
  hasAtLeastOneFilledRow,
  canSubmitRows,
} from "../components/actividad/activity.utils";

export default function Actividad() {
  const [tab, setTab] = useState("actividad"); // "actividad" | "resultado"
  const [rows, setRows] = useState(createEmptyRows(ROWS));

  const canSubmit = useMemo(() => canSubmitRows(rows), [rows]);

  function setCedula(i, value) {
    const clean = onlyDigits(value).slice(0, 8);
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, cedula: clean } : r))
    );
  }

  function setFecha(i, value) {
    const clean = onlyDigits(value).slice(0, 8);
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, fecha: clean } : r))
    );
  }

  function reset() {
    setRows(createEmptyRows(ROWS));
  }

  function submit() {
    if (!hasAtLeastOneFilledRow(rows)) {
      alert("Ingresá al menos una cédula / fecha.");
      return;
    }

    if (!canSubmit) {
      alert("Revisá los formatos: Cédula (7-8 dígitos) y Fecha Nac. (8 dígitos DDMMAAAA).");
      return;
    }

    console.log("Enviar:", rows);
    alert("Enviado (demo). Mirá la consola para ver los datos.");
    setTab("resultado");
  }

  return (
    <div className="activity-page">
      <ActivityTabs tab={tab} setTab={setTab} />

      {tab === "actividad" ? (
        <>
          <div className="activity-form">
            <div className="activity-grid-head">
              <div className="field-head">Cédula</div>

              <div className="field-head">
                Fecha de Nacimiento
                <div className="field-sub">DDMMAAAA</div>
              </div>
            </div>

            {rows.map((row, i) => (
              <ActivityRow
                key={i}
                index={i}
                row={row}
                onCedulaChange={setCedula}
                onFechaChange={setFecha}
                cedulaError={row.cedula !== "" && !isCedulaValid(row.cedula)}
                fechaError={row.fecha !== "" && !isFechaValid(row.fecha)}
              />
            ))}
          </div>

          <div className="activity-actions">
            <button className="btn btn-secondary" onClick={reset}>
              Restablecer
            </button>

            <button className="btn btn-primary" onClick={submit} disabled={!canSubmit}>
              Enviar
            </button>
          </div>
        </>
      ) : (
        <div className="activity-result">
          <h2>Resultado</h2>
          <p>Acá va la pantalla de resultados. (La conectamos cuando esté la API).</p>
        </div>
      )}
    </div>
  );
}