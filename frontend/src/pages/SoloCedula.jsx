import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/api";

function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function hasValue(value) {
  return cleanValue(value) !== "";
}

function onlyDigits(value) {
  return cleanValue(value).replace(/\D+/g, "");
}

function formatFechaDDMMYYYY(value) {
  if (!value) return "N/D";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/D";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

function onlyDigitsInput(value) {
  return value.replace(/\D/g, "");
}

/* =========================
   HEADER DETALLE
========================= */
function PersonaDetalleHeader({ item, onClose }) {
  const nombre = item?.nombreCompleto || "-";
  const cedula = item?.cedula || "s/d";

  const sexo = item?.sexo || "N/D";
  
  const edad =
    item?.edad !== null && item?.edad !== undefined && item?.edad !== ""
      ? `${item.edad} años`
      : "Edad s/d";

  const fechaNac = item?.fechaNacimiento || "N/D";

  return (
    <div className="afi-detail-hero">
      <div className="afi-detail-hero__top">
        <button
          className="afi-detail-back"
          type="button"
          onClick={onClose}
          aria-label="Volver"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="afi-detail-hero__chip is-consultar">Consultar</div>

      <div className="afi-detail-hero__name">{nombre}</div>

      <div className="afi-detail-hero__sub">
        {sexo} {edad} - {fechaNac}
      </div>

      <div className="afi-detail-hero__doc">Cédula {cedula}</div>
    </div>
  );
}

/* =========================
   TABS DETALLE
========================= */
function PersonaDetalleTabs({ detalleTab, setDetalleTab }) {
  return (
    <div className="afi-detail-tabs">
      <button
        className={`afi-detail-tab ${detalleTab === "datos" ? "is-active" : ""}`}
        type="button"
        onClick={() => setDetalleTab("datos")}
      >
        Datos
      </button>

      <div className="afi-detail-tab-divider" />

      <button
        className={`afi-detail-tab ${detalleTab === "vinculos" ? "is-active" : ""}`}
        type="button"
        onClick={() => setDetalleTab("vinculos")}
      >
        Vínculos
      </button>

      <div className="afi-detail-tab-divider" />

      <button
        className={`afi-detail-tab ${detalleTab === "acciones" ? "is-active" : ""}`}
        type="button"
        onClick={() => setDetalleTab("acciones")}
      >
        Acciones
      </button>
    </div>
  );
}

/* =========================
   DATOS
========================= */
function DetalleDatos({ item }) {
  const direccionLineas = [
    `Calle: ${cleanValue(item?.direccion?.calle) || "N/D"}`,
    `Nº: ${cleanValue(item?.direccion?.numero) || "N/D"}`,
    hasValue(item?.direccion?.esquinas)
      ? `Esquinas: ${cleanValue(item?.direccion?.esquinas)}`
      : "",
    hasValue(item?.direccion?.manzana)
      ? `Manzana: ${cleanValue(item?.direccion?.manzana)}`
      : "",
    hasValue(item?.direccion?.solar)
      ? `Solar: ${cleanValue(item?.direccion?.solar)}`
      : "",
    hasValue(item?.direccion?.ruta)
      ? `Ruta: ${cleanValue(item?.direccion?.ruta)}`
      : "",
    hasValue(item?.direccion?.km) ? `Km: ${cleanValue(item?.direccion?.km)}` : "",
  ].filter(Boolean);

  const direccion =
    direccionLineas.length > 0 ? direccionLineas.join("\n") : "Sin datos";

  const telefonos = [cleanValue(item?.telefonos?.telefono), cleanValue(item?.telefonos?.celular)]
    .filter(Boolean)
    .map((telefono) => ({
      raw: telefono,
      tel: onlyDigits(telefono),
    }));

  const cedulaSoloDigitos = onlyDigits(item?.cedula);

  const handleLlamar = (telefono) => {
    const tel = onlyDigits(telefono);
    if (!tel) return;
    window.location.href = `tel:${tel}`;
  };

  const handleSoloCi = () => {
    if (!cedulaSoloDigitos) return;
    window.location.href = `/cedula?ci=${encodeURIComponent(cedulaSoloDigitos)}`;
  };

  const handleActividad = () => {
    if (!cedulaSoloDigitos) return;
    window.location.href = `/actividad?ci=${encodeURIComponent(cedulaSoloDigitos)}`;
  };

  return (
    <div className="afi-detail-body">
      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Dirección</h3>

        <div className="afi-detail-section__value afi-detail-section__value--multiline">
          {direccion}
        </div>

        <div className="afi-detail-section__actions">
          <button type="button" className="afi-detail-link">
            DIRECCION
          </button>
          <button type="button" className="afi-detail-link">
            UBICACION
          </button>
          <button type="button" className="afi-detail-link">
            EDITAR
          </button>
        </div>
      </section>

      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Teléfonos</h3>

        <div className="afi-detail-phone-list">
          {telefonos.length > 0 ? (
            telefonos.map((telefono, idx) => (
              <div key={`${telefono.raw}-${idx}`} className="afi-detail-phone-row">
                <div className="afi-detail-phone-number">{telefono.raw}</div>
                <button
                  type="button"
                  className="afi-detail-link"
                  onClick={() => handleLlamar(telefono.raw)}
                >
                  LLAMAR
                </button>
              </div>
            ))
          ) : (
            <div className="afi-detail-phone-row is-empty">
              <div className="afi-detail-phone-number is-empty">Sin datos</div>
            </div>
          )}
        </div>
      </section>

      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Información</h3>

        <div className="afi-detail-info-grid">
          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Departamento</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.departamento) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Ciudad</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.ciudad) || "Sin datos"}
            </div>
          </div>
        </div>
      </section>

      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Acciones rápidas</h3>

        <div className="afi-detail-quick-actions">
          <button
            type="button"
            className="afi-detail-link"
            onClick={handleSoloCi}
            disabled={!cedulaSoloDigitos}
          >
            SOLO CI
          </button>

          <button
            type="button"
            className="afi-detail-link"
            onClick={handleActividad}
            disabled={!cedulaSoloDigitos}
          >
            ACTIVIDAD
          </button>

          <button type="button" className="afi-detail-link">
            NO ESTABA
          </button>

          <button type="button" className="afi-detail-link">
            NO ATIENDE
          </button>
        </div>
      </section>
    </div>
  );
}

/* =========================
   VINCULOS
========================= */
function DetalleVinculos() {
  return (
    <div className="afi-detail-body">
      <div className="afi-empty">Próximamente</div>
    </div>
  );
}

/* =========================
   ACCIONES
========================= */
function DetalleAcciones({
  accionesPersona,
  accionesPersonaLoading,
  accionesPersonaError,
}) {
  const handleOpenAdjunto = (accion) => {
    if (!accion?.accnum || !accion?.tieneAdjuntoVisible) return;

    window.open(
      `${API_BASE_URL}/personas/acciones/${encodeURIComponent(accion.accnum)}/adjunto`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (accionesPersonaLoading) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">Cargando acciones...</div>
      </div>
    );
  }

  if (accionesPersonaError) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">{accionesPersonaError}</div>
      </div>
    );
  }

  if (!accionesPersona.length) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">Sin acciones para mostrar.</div>
      </div>
    );
  }

  return (
    <div className="afi-detail-body">
      <div className="afi-detail-actions">
        {accionesPersona.map((accion, idx) => {
          const estadoClass =
            accion?.estado === "Finalizado"
              ? "is-finalizado"
              : accion?.estado === "Pendiente"
              ? "is-pendiente"
              : "is-desconocido";

          return (
            <article
              key={`${accion?.accnum || "accion"}-${idx}`}
              className={`afi-action-card ${estadoClass}`}
            >
              <div className="afi-action-card__top">
                <div className="afi-action-card__title">
                  {accion?.resnom || "Sin resultado"}
                </div>
                <div className="afi-action-card__date">
                  {accion?.fechaTexto || "-"}
                </div>
              </div>

              <div className="afi-action-card__state">{accion?.estado || "-"}</div>

              {Array.isArray(accion?.observacion) && accion.observacion.length > 0 ? (
                <div className="afi-action-card__obs">
                  {accion.observacion.map((item, i) => (
                    <div key={i} className="afi-action-card__obs-line">
                      {item?.label ? (
                        <>
                          <span className="afi-action-card__obs-label">{item.label}:</span>{" "}
                          <span className="afi-action-card__obs-value">{item.value}</span>
                        </>
                      ) : (
                        <span className="afi-action-card__obs-value">{item?.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="afi-action-card__footer">
                <div className="afi-action-card__footer-text">
                  Asesor: {accion?.asesorNombreCompleto || accion?.asenum || "-"}
                </div>

                {accion?.tieneAdjuntoVisible ? (
                  <button
                    type="button"
                    className="afi-detail-link afi-action-card__pdf-btn"
                    onClick={() => handleOpenAdjunto(accion)}
                  >
                    {accion?.adjuntoAccionLabel || "Ver Adjunto"}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PersonaDetalle({
  item,
  detalleTab,
  setDetalleTab,
  onClose,
  accionesPersona,
  accionesPersonaLoading,
  accionesPersonaError,
}) {
  return (
    <div className="afi-detail">
      <PersonaDetalleHeader item={item} onClose={onClose} />
      <PersonaDetalleTabs detalleTab={detalleTab} setDetalleTab={setDetalleTab} />

      {detalleTab === "datos" && <DetalleDatos item={item} />}
      {detalleTab === "vinculos" && <DetalleVinculos />}
      {detalleTab === "acciones" && (
        <DetalleAcciones
          accionesPersona={accionesPersona}
          accionesPersonaLoading={accionesPersonaLoading}
          accionesPersonaError={accionesPersonaError}
        />
      )}
    </div>
  );
}

export default function SoloCedula() {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [persona, setPersona] = useState(null);
  const [detalleTab, setDetalleTab] = useState("datos");

  const [accionesPersona, setAccionesPersona] = useState([]);
  const [accionesPersonaLoading, setAccionesPersonaLoading] = useState(false);
  const [accionesPersonaError, setAccionesPersonaError] = useState("");

  function onChange(e) {
    const clean = onlyDigitsInput(e.target.value).slice(0, 9);
    setCedula(clean);
  }

  async function buscar() {
    if (!cedula) {
      alert("Ingresá una cédula.");
      return;
    }

    if (cedula.length < 7) {
      alert("La cédula parece incompleta (mínimo 7 dígitos).");
      return;
    }

    setLoading(true);
    setError("");
    setPersona(null);
    setDetalleTab("datos");
    setAccionesPersona([]);
    setAccionesPersonaError("");

    try {
      const response = await fetch(`${API_BASE_URL}/solo-cedula/${cedula}`);
      const json = await response.json();

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "No se pudo consultar la cédula.");
      }

      if (!json.data) {
        setError("No se encontró información para la cédula ingresada.");
        return;
      }

      setPersona(json.data);
    } catch (err) {
      setError(err.message || "Ocurrió un error al consultar la cédula.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!persona?.cedula || detalleTab !== "acciones") return;

    let cancelled = false;

    async function cargarAcciones() {
      setAccionesPersonaLoading(true);
      setAccionesPersonaError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/personas/${encodeURIComponent(persona.cedula)}/acciones`
        );
        const json = await response.json();

        if (!response.ok || !json?.ok) {
          throw new Error(json?.error || "No se pudieron cargar las acciones.");
        }

        if (!cancelled) {
          setAccionesPersona(Array.isArray(json.items) ? json.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setAccionesPersona([]);
          setAccionesPersonaError(
            err.message || "Error al cargar acciones de la persona."
          );
        }
      } finally {
        if (!cancelled) {
          setAccionesPersonaLoading(false);
        }
      }
    }

    cargarAcciones();

    return () => {
      cancelled = true;
    };
  }, [persona, detalleTab]);

  const personaDetalle = useMemo(() => {
    if (!persona) return null;

    return {
      ...persona,
      fechaNac: persona.fechaNacimiento,
    };
  }, [persona]);

  function volverABusqueda() {
    setPersona(null);
    setDetalleTab("datos");
    setAccionesPersona([]);
    setAccionesPersonaError("");
  }

  if (personaDetalle) {
    return (
      <PersonaDetalle
        item={personaDetalle}
        detalleTab={detalleTab}
        setDetalleTab={setDetalleTab}
        onClose={volverABusqueda}
        accionesPersona={accionesPersona}
        accionesPersonaLoading={accionesPersonaLoading}
        accionesPersonaError={accionesPersonaError}
      />
    );
  }

  return (
    <div className="solo-page">
      <div className="solo-tabs">
        <button className="solo-tab is-active" type="button">
          Buscar Cédula
        </button>
        <div className="solo-tab-spacer" />
      </div>

      <div className="solo-content">
        <div className="solo-input-wrap">
          <input
            id="buscar-cedula"
            name="buscar_cedula"
            value={cedula}
            onChange={onChange}
            onFocus={(e) => e.target.select()}
            onDoubleClick={(e) => e.target.select()}
            onPointerUp={(e) => {
              if (e.target.value) e.target.select();
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="Cédula"
          />
          <div className="solo-underline" />
        </div>

        <button className="solo-btn" type="button" onClick={buscar} disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </button>

        {error ? <div className="afi-empty" style={{ marginTop: 18 }}>{error}</div> : null}
      </div>
    </div>
  );
}