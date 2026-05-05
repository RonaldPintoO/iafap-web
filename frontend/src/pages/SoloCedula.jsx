import { authFetch } from "../components/auth/auth.api";
import { useEffect, useState } from "react";
import PersonaDetalle from "../components/afiliaciones/PersonaDetalle";

function onlyDigitsInput(value) {
  return value.replace(/\D/g, "");
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

  const [showAccionModal, setShowAccionModal] = useState(false);
  const [accionesCatalogos, setAccionesCatalogos] = useState({
    tipos: [],
    resultados: [],
  });
  const [accionesCatalogosLoading, setAccionesCatalogosLoading] =
    useState(false);
  const [accionesCatalogosError, setAccionesCatalogosError] = useState("");

  const [accionSaving, setAccionSaving] = useState(false);
  const [accionSaveError, setAccionSaveError] = useState("");
  const [accionEditando, setAccionEditando] = useState(null);

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
    setShowAccionModal(false);
    setAccionSaveError("");
    setAccionEditando(null);

    try {
      const response = await authFetch(`/solo-cedula/${cedula}`);
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

  async function cargarAccionesCatalogos() {
    setAccionesCatalogosLoading(true);
    setAccionesCatalogosError("");

    try {
      const response = await authFetch("/personas/acciones/catalogos");
      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.ok) {
        throw new Error(json?.detail || "No se pudieron cargar las opciones.");
      }

      setAccionesCatalogos({
        tipos: Array.isArray(json.tipos) ? json.tipos : [],
        resultados: Array.isArray(json.resultados) ? json.resultados : [],
      });
    } catch (err) {
      setAccionesCatalogos({ tipos: [], resultados: [] });
      setAccionesCatalogosError(
        err.message || "No se pudieron cargar las opciones.",
      );
    } finally {
      setAccionesCatalogosLoading(false);
    }
  }

  async function abrirNuevaAccion() {
    setAccionSaveError("");
    setAccionEditando(null);
    setShowAccionModal(true);

    if (
      !accionesCatalogos.tipos.length ||
      !accionesCatalogos.resultados.length
    ) {
      await cargarAccionesCatalogos();
    }
  }

  async function abrirEditarAccion(accion) {
    if (!accion?.accnum) return;

    setAccionSaveError("");
    setAccionEditando(accion);
    setShowAccionModal(true);

    if (
      !accionesCatalogos.tipos.length ||
      !accionesCatalogos.resultados.length
    ) {
      await cargarAccionesCatalogos();
    }
  }

  function cerrarNuevaAccion() {
    if (accionSaving) return;

    setShowAccionModal(false);
    setAccionSaveError("");
    setAccionEditando(null);
  }

  async function guardarNuevaAccion(payload) {
    const ci = String(persona?.cedula || "").trim();
    if (!ci) return;

    setAccionSaving(true);
    setAccionSaveError("");

    try {
      const editandoAccnum = accionEditando?.accnum;

      const url = editandoAccnum
        ? `/personas/acciones/${encodeURIComponent(editandoAccnum)}`
        : `/personas/${encodeURIComponent(ci)}/acciones`;

      const method = editandoAccnum ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.ok) {
        throw new Error(
          json?.detail ||
            json?.error ||
            (editandoAccnum
              ? "No se pudo actualizar la acción."
              : "No se pudo guardar la acción."),
        );
      }

      setAccionesPersona(Array.isArray(json.items) ? json.items : []);
      setShowAccionModal(false);
      setAccionEditando(null);
    } catch (err) {
      setAccionSaveError(
        err.message ||
          (accionEditando?.accnum
            ? "No se pudo actualizar la acción."
            : "No se pudo guardar la acción."),
      );
    } finally {
      setAccionSaving(false);
    }
  }

  useEffect(() => {
    if (!persona?.cedula || detalleTab !== "acciones") return;

    let cancelled = false;

    async function cargarAcciones() {
      setAccionesPersonaLoading(true);
      setAccionesPersonaError("");

      try {
        const response = await authFetch(
          `/personas/${encodeURIComponent(persona.cedula)}/acciones`,
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
            err.message || "Error al cargar acciones de la persona.",
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

  const personaDetalle = persona || null;

  function volverABusqueda() {
    setPersona(null);
    setDetalleTab("datos");
    setAccionesPersona([]);
    setAccionesPersonaError("");
    setShowAccionModal(false);
    setAccionSaveError("");
    setAccionEditando(null);
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
        showAccionModal={showAccionModal}
        accionesCatalogos={accionesCatalogos}
        accionesCatalogosLoading={accionesCatalogosLoading}
        accionesCatalogosError={accionesCatalogosError}
        accionSaving={accionSaving}
        accionSaveError={accionSaveError}
        accionEditando={accionEditando}
        onOpenNuevaAccion={abrirNuevaAccion}
        onOpenEditarAccion={abrirEditarAccion}
        onCloseNuevaAccion={cerrarNuevaAccion}
        onSaveNuevaAccion={guardarNuevaAccion}
        onReloadAccionesCatalogos={cargarAccionesCatalogos}
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

        <button
          className="solo-btn"
          type="button"
          onClick={buscar}
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>

        {error ? (
          <div className="afi-empty" style={{ marginTop: 18 }}>
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}