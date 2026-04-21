import { authFetch } from '../components/auth/auth.api';
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
      const response = await authFetch(`/solo-cedula/${cedula}`);
      const json = await response.json();
      console.log(json.data);

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
        const response = await authFetch(`/personas/${encodeURIComponent(persona.cedula)}/acciones`);
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
