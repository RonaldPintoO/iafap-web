export default function DetalleFormulario({
  formularioUrl,
  formularioLoading,
  formularioError,
  formularioDisponible,
  formularioMimeType,
  onImageError,
}) {
  if (formularioLoading) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">Cargando formulario...</div>
      </div>
    );
  }

  if (formularioError) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">{formularioError}</div>
      </div>
    );
  }

  if (!formularioDisponible) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">
          No hay formulario disponible para esta persona.
        </div>
      </div>
    );
  }

  const mime = String(formularioMimeType || "").toLowerCase();
  const esHeif = mime.includes("heif") || mime.includes("heic");

  function handleOpenFormulario() {
    if (!formularioUrl) return;
    window.open(formularioUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="afi-detail-body">
      <div className="afi-formulario-wrap">
        <div
          className="afi-formulario-card afi-formulario-card-clickable"
          onClick={handleOpenFormulario}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpenFormulario();
            }
          }}
          title="Abrir imagen en una nueva pestaña"
        >
          {esHeif ? (
            <div className="afi-empty">
              El archivo existe, pero está en formato HEIF/HEIC y este
              navegador puede no previsualizarlo directamente.
              <br />
              Haz clic para abrirlo en una nueva pestaña.
            </div>
          ) : (
            <img
              src={formularioUrl}
              alt="Formulario de afiliación"
              className="afi-formulario-image"
              onError={onImageError}
            />
          )}
        </div>
      </div>
    </div>
  );
}