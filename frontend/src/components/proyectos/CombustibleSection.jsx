import Tabs from "./Tabs";
import { BaseField, DateField } from "./BaseField";

const FUEL_TABS = [
  { id: "combustible", label: "Combustible" },
  { id: "foto", label: "Foto" },
];

export default function CombustibleSection({
  mode,
  fuelTab,
  setFuelTab,
  proyecto,
  setProyecto,
  proyectosDemo,
  rut,
  setRut,
  boleta,
  setBoleta,
  fechaISO,
  setFechaISO,
  importe,
  setImporte,
  fuelImage,
  onClickFotoTab,
  onSiguiente,
  onEnviar,
  resetFuel,
  photoCamRef,
  photoFileRef,
  onlyDigits,
}) {
  return (
    <div className="fuel-wrap">
      {mode === null ? (
        <div className="fuel-body">
          <div className="fuel-empty" />
        </div>
      ) : (
        <>
          <Tabs
            tabs={FUEL_TABS}
            active={fuelTab}
            onChange={(id) => {
              if (id === "foto") {
                onClickFotoTab();
                return;
              }
              setFuelTab(id);
            }}
            ariaLabel="Combustible tabs"
          />

          {fuelTab === "combustible" && (
            <div className="fuel-body">
              <div className="fuel-project">
                <select
                  className="fuel-project__select"
                  value={proyecto}
                  onChange={(e) => setProyecto(e.target.value)}
                >
                  {proyectosDemo.map((p) => (
                    <option value={p} key={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined fuel-project__chev">
                  arrow_drop_down
                </span>
              </div>

              <div className="fuel-form">
                <BaseField
                  label="Rut"
                  value={rut}
                  onChange={(v) => setRut(onlyDigits(v).slice(0, 12))}
                  inputMode="numeric"
                />

                <BaseField
                  label="Nro. Boleta"
                  value={boleta}
                  onChange={(v) => setBoleta(onlyDigits(v).slice(0, 18))}
                  inputMode="numeric"
                />

                <DateField label="Fecha" value={fechaISO} onChange={setFechaISO} />

                <BaseField
                  label="Importe"
                  value={importe}
                  onChange={(v) => setImporte(v.replace(/[^\d.,]/g, "").slice(0, 12))}
                  inputMode="decimal"
                />

                <div className="fuel-send-row">
                  <button
                    type="button"
                    className="fuel-send"
                    onClick={onSiguiente}
                    aria-label="Siguiente"
                    title="Siguiente"
                  >
                    <span className="material-symbols-outlined">navigate_next</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {fuelTab === "foto" && (
            <div className="fuel-photo">
              <div className="fuel-photo__inner">
                <div className="fuel-photo__box">
                  {fuelImage?.url ? (
                    <img className="fuel-photo__img" src={fuelImage.url} alt="Boleta / Foto" />
                  ) : (
                    <div className="fuel-photo__placeholder">(Sin foto)</div>
                  )}
                </div>

                <div className="fuel-photo__actions">
                  <button
                    type="button"
                    className="fuel-photo__btn"
                    onClick={() => photoCamRef.current?.click()}
                  >
                    Tomar foto
                  </button>

                  <button
                    type="button"
                    className="fuel-photo__btn"
                    onClick={() => photoFileRef.current?.click()}
                  >
                    Subir archivo
                  </button>

                  <button
                    type="button"
                    className="fuel-photo__btn fuel-photo__btn--muted"
                    onClick={resetFuel}
                  >
                    Reiniciar
                  </button>
                </div>

                <button
                  type="button"
                  className="fuel-send fuel-send--fab"
                  onClick={onEnviar}
                  aria-label="Enviar"
                  title="Enviar"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}