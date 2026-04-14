import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import PersonaDetalleHeader from "./PersonaDetalleHeader";
import PersonaDetalleTabs from "./PersonaDetalleTabs";
import DetalleDatos from "./DetalleDatos";
import DetalleVinculos from "./DetalleVinculos";
import DetalleAcciones from "./DetalleAcciones";
import DetalleBps from "./DetalleBps";

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (detalleTab === "bps" && !telefonoBpsConsultado) {
      handleConsultarTelefonoBps();
    }
  }, [detalleTab, telefonoBpsConsultado, item]);

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
      setTelefonoBpsError(error.message);
    } finally {
      setTelefonoBpsLoading(false);
    }
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
          onConsultarTelefonoBps={handleConsultarTelefonoBps}
        />
      )}
    </div>
  );
}
