import { authFetch } from '../components/auth/auth.api';
import { useEffect, useState } from "react";

function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function onlyDigits(value) {
  return cleanValue(value).replace(/\D+/g, "");
}

export default function useDetalleFormulario(item, detalleTab) {
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
    if (formularioUrl) {
      URL.revokeObjectURL(formularioUrl);
    }

    setFormularioLoading(false);
    setFormularioError("");
    setFormularioConsultado(false);
    setFormularioDisponible(false);
    setFormularioUrl("");
    setFormularioMimeType("");
  }, [item?.cedula, item?.documentoExtranjero, item?.idPaisExtranjero]);

  useEffect(() => {
    if (detalleTab !== "formulario" || formularioConsultado) return;
    handleConsultarFormulario();
  }, [detalleTab, formularioConsultado, item]);

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

      const response = await authFetch(`/personas/${encodeURIComponent(cedula)}/formulario`);

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
          /* empty */
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
      "El archivo fue encontrado, pero no se pudo previsualizar en el navegador.",
    );
  }

  return {
    formularioUrl,
    formularioLoading,
    formularioError,
    formularioDisponible,
    formularioMimeType,
    onImageError: handleFormularioImageError,
    onConsultarFormulario: handleConsultarFormulario,
  };
}
