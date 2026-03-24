import Tabs from "./Tabs";
import FabButton from "./FabButton";
import StatusPill from "./StatusPill";
import { BaseField, DateField, TimeField } from "./BaseField";

export default function AlquilerSection({
  rentMode,
  rentList,
  rentActive,
  rentStep,
  rentSubTab,
  setRentSubTab,
  openRentNew,
  openRentStep,
  getStatusStyle,
  isoToDDMMYYYY,
  updateRentStep,
  normalizeTimeHHMM,
  onlyDigits,
  formatPlate,
  normalizePlate,
  validateRentStep,
  showAlert,
  setRentMode,
  setRentActiveId,
  setRentStep,
  setRentSubTabForm,
  rentCamRef,
  rentFileRef,
  onRentPhotoPicked,
  onRentEnviar,
}) {
  const devolucionTabs = [
    { id: "form", label: "Devolución" },
    { id: "foto", label: "Foto" },
  ];

  return (
    <div className="fuel-wrap">
      {rentMode === null && (
        <>
          <div className="fuel-body">
            {rentList.length === 0 ? (
              <div className="proj-empty">(Sin solicitudes)</div>
            ) : (
              <div className="rent-list">
                {rentList.map((r) => (
                  <div key={r.id} className="rent-card">
                    <div className="rent-card__top">
                      <div className="rent-card__dates">
                        <div>Desde: {r.desdeISO ? isoToDDMMYYYY(r.desdeISO) : "-"}</div>
                        <div>Hasta: {r.hastaISO ? isoToDDMMYYYY(r.hastaISO) : "-"}</div>
                      </div>

                      <StatusPill status={r.estado} getStatusStyle={getStatusStyle} />
                    </div>

                    <div className="rent-card__mid">
                      <div>{r.departamentos ? `${r.departamentos}.` : "Departamentos: -"}</div>
                      <div>
                        Adelanto: ${r.adelanto || "-"}. Fichas requeridas: {r.fichas || "-"}.
                      </div>
                    </div>

                    <div className="rent-card__actions">
                      <button
                        type="button"
                        className="rent-btn rent-btn--primary"
                        onClick={() => openRentStep(r.id, "retiro")}
                      >
                        Retiro
                      </button>

                      <button
                        type="button"
                        className="rent-btn rent-btn--primary"
                        onClick={() => openRentStep(r.id, "devolucion")}
                      >
                        Devolución
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <FabButton onClick={openRentNew} label="Agregar" icon="add" />
        </>
      )}

      {rentMode === "detalle" && rentActive && (
        <>
          {rentStep === "retiro" ? (
            <>
              <div className="fuel-tabs" role="tablist" aria-label="Alquiler tabs">
                <button
                  type="button"
                  role="tab"
                  aria-selected
                  className="fuel-tab is-active"
                  onClick={() => {}}
                >
                  Retiro
                </button>

                <div className="fuel-tab-divider" />

                <button
                  type="button"
                  role="tab"
                  aria-selected={false}
                  className="fuel-tab"
                  onClick={() => {}}
                  style={{ opacity: 0.45, cursor: "default" }}
                >
                  Foto
                </button>
              </div>

              <div className="fuel-body">
                <div className="fuel-form">
                  <DateField
                    label="Fecha"
                    value={rentActive.retiro.fechaISO}
                    onChange={(v) => updateRentStep("retiro", { fechaISO: v })}
                  />

                  <TimeField
                    label="Hora"
                    value={rentActive.retiro.hora}
                    onChange={(v) =>
                      updateRentStep("retiro", { hora: normalizeTimeHHMM(v) })
                    }
                  />

                  <BaseField
                    label="Kilómetros"
                    value={rentActive.retiro.km}
                    onChange={(v) =>
                      updateRentStep("retiro", { km: onlyDigits(v).slice(0, 8) })
                    }
                    inputMode="numeric"
                  />

                  <BaseField
                    label="Matrícula"
                    value={formatPlate(rentActive.retiro.plateRaw)}
                    onChange={(v) =>
                      updateRentStep("retiro", { plateRaw: normalizePlate(v) })
                    }
                    inputMode="text"
                    placeholder="ABC 1234"
                  />

                  <div className="fuel-send-row">
                    <button
                      type="button"
                      className="fuel-send"
                      onClick={() => {
                        if (!validateRentStep()) return;

                        showAlert("Retiro guardado (demo).", () => {
                          setRentMode(null);
                          setRentActiveId(null);
                          setRentStep("retiro");
                          setRentSubTabForm("form");
                        });
                      }}
                      aria-label="Enviar"
                      title="Enviar"
                    >
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Tabs
                tabs={devolucionTabs}
                active={rentSubTab}
                onChange={(id) => {
                  if (id === "foto") {
                    if (!validateRentStep()) return;
                    setRentSubTab("foto");
                    return;
                  }
                  setRentSubTab(id);
                }}
                ariaLabel="Alquiler tabs"
              />

              {rentSubTab === "form" && (
                <div className="fuel-body">
                  <div className="fuel-form">
                    <DateField
                      label="Fecha"
                      value={rentActive.devolucion.fechaISO}
                      onChange={(v) => updateRentStep("devolucion", { fechaISO: v })}
                    />

                    <TimeField
                      label="Hora"
                      value={rentActive.devolucion.hora}
                      onChange={(v) =>
                        updateRentStep("devolucion", { hora: normalizeTimeHHMM(v) })
                      }
                    />

                    <BaseField
                      label="Kilómetros"
                      value={rentActive.devolucion.km}
                      onChange={(v) =>
                        updateRentStep("devolucion", { km: onlyDigits(v).slice(0, 8) })
                      }
                      inputMode="numeric"
                    />

                    <BaseField
                      label="Matrícula"
                      value={formatPlate(rentActive.devolucion.plateRaw)}
                      onChange={(v) =>
                        updateRentStep("devolucion", { plateRaw: normalizePlate(v) })
                      }
                      inputMode="text"
                      placeholder="ABC 1234"
                    />

                    <div className="fuel-send-row">
                      <button
                        type="button"
                        className="fuel-send"
                        onClick={() => {
                          if (!validateRentStep()) return;
                          setRentSubTab("foto");
                        }}
                        aria-label="Siguiente"
                        title="Siguiente"
                      >
                        <span className="material-symbols-outlined">navigate_next</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {rentSubTab === "foto" && (
                <div className="fuel-photo">
                  <div className="fuel-photo__inner">
                    <div className="fuel-photo__box">
                      {rentActive.devolucion.foto?.url ? (
                        <img
                          className="fuel-photo__img"
                          src={rentActive.devolucion.foto.url}
                          alt="Foto"
                        />
                      ) : (
                        <div className="fuel-photo__placeholder">(Sin foto)</div>
                      )}
                    </div>

                    <div className="fuel-photo__actions">
                      <button
                        type="button"
                        className="fuel-photo__btn"
                        onClick={() => rentCamRef.current?.click()}
                      >
                        Tomar foto
                      </button>

                      <button
                        type="button"
                        className="fuel-photo__btn"
                        onClick={() => rentFileRef.current?.click()}
                      >
                        Subir archivo
                      </button>

                      <button
                        type="button"
                        className="fuel-photo__btn fuel-photo__btn--muted"
                        onClick={() => setRentSubTab("form")}
                      >
                        Volver
                      </button>
                    </div>

                    <button
                      type="button"
                      className="fuel-send fuel-send--fab"
                      onClick={onRentEnviar}
                      aria-label="Enviar"
                      title="Enviar"
                    >
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>

                  <input
                    ref={rentCamRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={onRentPhotoPicked}
                  />
                  <input
                    ref={rentFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onRentPhotoPicked}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}