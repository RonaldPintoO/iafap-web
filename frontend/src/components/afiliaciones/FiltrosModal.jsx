import ModalDropdown from "./ModalDropdown";
import { PERSONAS_FILTER_OPTIONS } from "./afiliaciones.utils";

export default function FiltrosModal({
  showFilters,
  setShowFilters,
  tab,
  personasValues,
  setPersonasValues,
  agendadosValues,
  setAgendadosValues,
  openDropdownId,
  setOpenDropdownId,
  personasFilterCatalogs,
  onAcceptPersonas,
  personasFiltrosError,
}) {
  const tipos = personasFilterCatalogs?.tipos || ["Todos"];
  const acciones = personasFilterCatalogs?.acciones || ["Todos"];

  return (
    <div
      className={`afi-modal-backdrop ${showFilters ? "is-open" : ""}`}
      onClick={() => setShowFilters(false)}
    >
      <div className="afi-modal" onClick={(e) => e.stopPropagation()}>
        <div className="afi-modal-body">
          {tab === "personas" && (
            <>
              <div className="afi-modal-row">
                <div className="afi-modal-label">Texto</div>
                <div className="afi-modal-field">
                  <input
                    id="filtro-texto"
                    name="filtro_texto"
                    className="afi-modal-input"
                    value={personasValues.texto}
                    onChange={(e) =>
                      setPersonasValues((p) => ({ ...p, texto: e.target.value }))
                    }
                    placeholder="Nombre, apellido, documento, calle, teléfono..."
                  />
                  <div className="afi-modal-underline" />
                </div>
              </div>

              <ModalDropdown
                id="tipo"
                label="Tipo"
                value={personasValues.tipo}
                options={tipos}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                onChange={(next) =>
                  setPersonasValues((p) => ({ ...p, tipo: next }))
                }
              />

              <div className="afi-modal-row">
                <div className="afi-modal-label">Edad</div>

                <div className="afi-modal-field">
                  <div className="afi-modal-age-range">
                    <input
                      className={`afi-modal-input afi-modal-age-input ${
                        personasFiltrosError ? "is-error" : ""
                      }`}
                      type="number"
                      min="0"
                      placeholder="Desde"
                      value={personasValues.edadDesde}
                      onChange={(e) =>
                        setPersonasValues((p) => ({
                          ...p,
                          edadDesde: e.target.value,
                        }))
                      }
                    />

                    <span className="afi-modal-age-sep">–</span>

                    <input
                      className={`afi-modal-input afi-modal-age-input ${
                        personasFiltrosError ? "is-error" : ""
                      }`}
                      type="number"
                      min="0"
                      placeholder="Hasta"
                      value={personasValues.edadHasta}
                      onChange={(e) =>
                        setPersonasValues((p) => ({
                          ...p,
                          edadHasta: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className={`afi-modal-underline ${personasFiltrosError ? "is-error" : ""}`} />

                  {personasFiltrosError && (
                    <div className="afi-modal-error">{personasFiltrosError}</div>
                  )}
                </div>
              </div>

              <ModalDropdown
                id="edadParidad"
                label="Edad par"
                value={personasValues.edadParidad}
                options={PERSONAS_FILTER_OPTIONS.edadParidad}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                onChange={(next) =>
                  setPersonasValues((p) => ({ ...p, edadParidad: next }))
                }
              />

              <ModalDropdown
                id="nacionalidad"
                label="Nacionalidad"
                value={personasValues.nacionalidad}
                options={PERSONAS_FILTER_OPTIONS.nacionalidad}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                onChange={(next) =>
                  setPersonasValues((p) => ({ ...p, nacionalidad: next }))
                }
              />

              <ModalDropdown
                id="estado"
                label="Estado"
                value={personasValues.estado}
                options={PERSONAS_FILTER_OPTIONS.estado}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                onChange={(next) =>
                  setPersonasValues((p) => ({ ...p, estado: next }))
                }
              />

              <ModalDropdown
                id="fechaAccion"
                label={"Fecha Acción\n(días)"}
                value={personasValues.fechaAccion}
                options={PERSONAS_FILTER_OPTIONS.fechaAccion}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                onChange={(next) =>
                  setPersonasValues((p) => ({ ...p, fechaAccion: next }))
                }
              />

              <ModalDropdown
                id="accion"
                label="Acción"
                value={personasValues.accion}
                options={acciones}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                onChange={(next) =>
                  setPersonasValues((p) => ({ ...p, accion: next }))
                }
              />

              <ModalDropdown
                id="ley"
                label="Ley"
                value={personasValues.ley}
                options={PERSONAS_FILTER_OPTIONS.ley}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                onChange={(next) =>
                  setPersonasValues((p) => ({ ...p, ley: next }))
                }
              />
            </>
          )}

          {tab === "agendados" && (
            <>
              <ModalDropdown
                id="fecha"
                label="Fecha"
                value={agendadosValues.fecha}
                options={["Todos", "Hoy", "Mañana", "Esta Semana", "Semana Próxima"]}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                onChange={(next) =>
                  setAgendadosValues((p) => ({ ...p, fecha: next }))
                }
              />

              <ModalDropdown
                id="dptoAg"
                label="Dpto."
                value={agendadosValues.dptoAg}
                options={[
                  "Todos",
                  "CANELONES",
                  "CERRO LARGO",
                  "LAVALLEJA",
                  "MALDONADO",
                  "MONTEVIDEO",
                  "PAYSANDU",
                  "SALTO",
                  "SAN JOSE",
                  "SORIANO",
                  "TACUAREMBO",
                ]}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                onChange={(next) =>
                  setAgendadosValues((p) => ({ ...p, dptoAg: next }))
                }
              />

              <ModalDropdown
                id="loc"
                label="Loc."
                value={agendadosValues.loc}
                options={["Todos", "(pendiente: depende del Dpto.)"]}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
                onChange={(next) =>
                  setAgendadosValues((p) => ({ ...p, loc: next }))
                }
              />
            </>
          )}
        </div>

        <div className="afi-modal-actions">
          <button
            className="afi-modal-action"
            type="button"
            onClick={() => setShowFilters(false)}
          >
            CANCELAR
          </button>

          <button
            className="afi-modal-action"
            type="button"
            onClick={() => {
              if (tab === "personas") {
                onAcceptPersonas();
              } else {
                setShowFilters(false);
              }
            }}
          >
            ACEPTAR
          </button>
        </div>
      </div>
    </div>
  );
}