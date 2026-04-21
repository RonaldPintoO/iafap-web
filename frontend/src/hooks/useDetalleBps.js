import { authFetch } from '../components/auth/auth.api';
import { useEffect, useState } from "react";

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

export default function useDetalleBps(item, detalleTab) {
  const [telefonosBps, setTelefonosBps] = useState([]);
  const [telefonoBpsLoading, setTelefonoBpsLoading] = useState(false);
  const [telefonoBpsError, setTelefonoBpsError] = useState("");
  const [telefonoBpsConsultado, setTelefonoBpsConsultado] = useState(false);
  const [direccionBps, setDireccionBps] = useState(null);

  useEffect(() => {
    setTelefonosBps([]);
    setTelefonoBpsLoading(false);
    setTelefonoBpsError("");
    setTelefonoBpsConsultado(false);
    setDireccionBps(null);
  }, [item?.cedula, item?.documentoExtranjero, item?.idPaisExtranjero]);

  useEffect(() => {
    if (detalleTab !== "bps" || telefonoBpsConsultado) return;
    handleConsultarTelefonoBps();
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

      const response = await authFetch(`/personas/bps`, {
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

  return {
    telefonosBps,
    telefonoBpsLoading,
    telefonoBpsError,
    telefonoBpsConsultado,
    direccionBps,
    onConsultarTelefonoBps: handleConsultarTelefonoBps,
  };
}
