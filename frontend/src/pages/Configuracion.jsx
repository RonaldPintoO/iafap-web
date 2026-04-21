import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfigSelectField from "../components/configuracion/ConfigSelectField";
import {
  getConfiguracionGuardada,
  saveConfiguracion,
} from "../components/configuracion/configuracion.utils";
import { authFetch } from "../components/auth/auth.api";

export default function Configuracion() {
  const navigate = useNavigate();

  const [options, setOptions] = useState([]);
  const [asesor, setAsesor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const asesorLabel = useMemo(() => {
    return options.find((opt) => opt.value === asesor)?.label || "";
  }, [options, asesor]);

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await authFetch(`/configuracion/asesores`);
        if (!res.ok) throw new Error("No se pudo cargar la configuración");

        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];

        if (cancelled) return;

        setOptions(items);

        const saved = getConfiguracionGuardada();

        if (saved?.asesorCodigo) {
          setAsesor(String(saved.asesorCodigo));
        } else if (items.length > 0) {
          setAsesor(items[0].value);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Error cargando configuración");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = () => {
    saveConfiguracion({
      asesorCodigo: asesor,
      asesorLabel,
    });

    navigate("/afiliaciones");
  };

  return (
    <div className="cfg-page">
      <div className="cfg-title">Configuración</div>
      <div className="cfg-underline" />

      <div className="cfg-content">
        <ConfigSelectField
          label="Usuario de trabajo"
          value={asesor}
          options={options}
          onChange={setAsesor}
          ariaLabel="Usuario de trabajo"
        />

        <div className="cfg-actions">
          <button
            className="cfg-save"
            type="button"
            onClick={onSave}
            disabled={loading || !asesor}
          >
            Guardar
          </button>
        </div>

        {loading && <div style={{ marginTop: 12 }}>Cargando usuarios de trabajo...</div>}
        {error && <div style={{ marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}
