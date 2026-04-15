import { useState, useEffect } from "react";

import { API_BASE_URL } from "../../config/api";
import PersonaDetalleHeader from "./PersonaDetalleHeader";
import PersonaDetalleTabs from "./PersonaDetalleTabs";
import DetalleDatos from "./DetalleDatos";
import DetalleVinculos from "./DetalleVinculos";
import DetalleAcciones from "./DetalleAcciones";
import DetalleBps from "./DetalleBps";
import DetalleFormulario from "./DetalleFormulario";

function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function onlyDigits(value) {
  return cleanValue(value).replace(/\D+/g, "");
}

function buildBpsDocumentoPayload(item) {
  const esExtranjero = Boolean(item?.tieneDocumentoExtranjero);

  if (esExtranjero) {
    const nroDocumento = cleanValue(item?.documentoExtranjero);
    const paisDocumento = cleanValue(item?.idPaisExtranjero);
    const tipoDocumento = cleanValue(item?.tipoDocumentoExtranjero);

    if (nroDocumento && paisDocumento && tipoDocumento) {
      return {
        nroDocumento,
        paisDocumento,
        tipoDocumento,
      };
    }
  }

  const nroDocumento = onlyDigits(item?.cedula);
  if (!nroDocumento) return null;

  return {
    nroDocumento,
    paisDocumento: "1",
    tipoDocumento: "DO",
  };
}

export default function PersonaDetalle({
  item,
  detalleTab,
  setDetalleTab,
  onClose,
  accionesPersona,
  accionesPersonaLoading,
  accionesPersonaError,
}) {
  const [telefonosBps, setTelefonosBps] = useState([]);
  const [telefonoBpsLoading, setTelefonoBpsLoading] = useState(false);
  const [telefonoBpsError, setTelefonoBpsError] = useState("");
  const [telefonoBpsConsultado, setTelefonoBpsConsultado] = useState(false);
  const [direccionBps, setDireccionBps] = useState(null);

  const [formularioLoading, setFormularioLoading] = useState(false);
  const [formularioError, setFormularioError] = useState("");
  const [formularioConsultado, setFormularioConsultado] = useState(false);
  const [formularioDisponible, setFormularioDisponible] = useState(false);
  const [formularioUrl, setFormularioUrl] = useState("");
  const [formularioMimeType, setFormularioMimeType] = useState("");

  useEffect(() => {
    return () => {
      if (formularioUrl) {
        URL.revokeObjectURL(formularioUrl);
      }
    };
  }, [formularioUrl]);

  useEffect(() => {
    setTelefonosBps([]);
    setTelefonoBpsLoading(false);
    setTelefonoBpsError("");
    setTelefonoBpsConsultado(false);
    setDireccionBps(null);

    if (formularioUrl) {
      URL.revokeObjectURL(formularioUrl);
    }

    setFormularioLoading(false);
    setFormularioError("");
    setFormularioConsultado(false);
    setFormularioDisponible(false);
    setFormularioUrl("");
    setFormularioMimeType("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.cedula, item?.documentoExtranjero, item?.idPaisExtranjero]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (detalleTab === "bps" && !telefonoBpsConsultado) {
      handleConsultarTelefonoBps();
    }
  }, [detalleTab, telefonoBpsConsultado, item]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (detalleTab === "formulario" && !formularioConsultado) {
      handleConsultarFormulario();
    }
  }, [detalleTab, formularioConsultado, item]);

  async function handleConsultarTelefonoBps() {
    const payload = buildBpsDocumentoPayload(item);

    if (!payload) {
      setTelefonosBps([]);
      setDireccionBps(null);
      setTelefonoBpsError("No hay documento válido para consultar BPS");
      return;
    }

    try {
      setTelefonoBpsLoading(true);
      setTelefonoBpsError("");

      const response = await fetch(`${API_BASE_URL}/personas/telefono-bps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.detail || "Error BPS");
      }

      setTelefonosBps(Array.isArray(data.telefonos) ? data.telefonos : []);
      setDireccionBps(data.direccion || null);
      setTelefonoBpsConsultado(true);
    } catch (error) {
      setTelefonoBpsError(error.message || "Error consultando BPS");
    } finally {
      setTelefonoBpsLoading(false);
    }
  }

  async function handleConsultarFormulario() {
    const cedula = onlyDigits(item?.cedula);

    if (!cedula) {
      setFormularioDisponible(false);
      setFormularioError("No hay cédula válida para consultar el formulario");
      setFormularioConsultado(true);
      return;
    }

    try {
      setFormularioLoading(true);
      setFormularioError("");

      const response = await fetch(
        `${API_BASE_URL}/personas/${encodeURIComponent(cedula)}/formulario`,
        {
          method: "GET",
        }
      );

      if (response.status === 404) {
        setFormularioDisponible(false);
        setFormularioConsultado(true);
        setFormularioError("");
        return;
      }

      if (!response.ok) {
        let detail = "Error consultando formulario";

        try {
          const data = await response.json();
          detail = data?.detail || detail;
        } catch {
          // no-op
        }

        throw new Error(detail);
      }

      const blob = await response.blob();
      const mimeType = response.headers.get("Content-Type") || blob.type || "";
      const url = URL.createObjectURL(blob);

      if (formularioUrl) {
        URL.revokeObjectURL(formularioUrl);
      }

      setFormularioMimeType(mimeType);
      setFormularioUrl(url);
      setFormularioDisponible(true);
      setFormularioConsultado(true);
    } catch (error) {
      setFormularioDisponible(false);
      setFormularioError(error.message || "Error consultando formulario");
      setFormularioConsultado(true);
    } finally {
      setFormularioLoading(false);
    }
  }

  function handleFormularioImageError() {
    setFormularioError(
      "El archivo fue encontrado, pero no se pudo previsualizar en el navegador."
    );
  }

  return (
    <div className="afi-detail">
      <PersonaDetalleHeader item={item} onClose={onClose} />

      <PersonaDetalleTabs value={detalleTab} onChange={setDetalleTab} />

      {detalleTab === "datos" && <DetalleDatos item={item} />}

      {detalleTab === "vinculos" && <DetalleVinculos />}

      {detalleTab === "acciones" && (
        <DetalleAcciones
          accionesPersona={accionesPersona}
          accionesPersonaLoading={accionesPersonaLoading}
          accionesPersonaError={accionesPersonaError}
        />
      )}

      {detalleTab === "bps" && (
        <DetalleBps
          telefonosBps={telefonosBps}
          telefonoBpsLoading={telefonoBpsLoading}
          telefonoBpsError={telefonoBpsError}
          telefonoBpsConsultado={telefonoBpsConsultado}
          direccionBps={direccionBps}
        />
      )}

      {detalleTab === "formulario" && (
        <DetalleFormulario
          formularioUrl={formularioUrl}
          formularioLoading={formularioLoading}
          formularioError={formularioError}
          formularioDisponible={formularioDisponible}
          formularioMimeType={formularioMimeType}
          onImageError={handleFormularioImageError}
        />
      )}
    </div>
  );
}