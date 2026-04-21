import { apiFetch } from "../../config/api";

export default function DetalleAcciones({
  accionesPersona,
  accionesPersonaLoading,
  accionesPersonaError,
}) {
  const handleOpenAdjunto = async (accion) => {
    if (!accion?.accnum || !accion?.tieneAdjuntoVisible) return;

    try {
      const response = await apiFetch(
        `/personas/acciones/${encodeURIComponent(accion.accnum)}/adjunto`,
      );

      if (!response.ok) {
        throw new Error('No se pudo abrir el adjunto');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      window.alert(error.message || 'No se pudo abrir el adjunto');
    }
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

              <div className="afi-action-card__state">
                {accion?.estado || "-"}
              </div>

              {Array.isArray(accion?.observacion) &&
              accion.observacion.length > 0 ? (
                <div className="afi-action-card__obs">
                  {accion.observacion.map((item, i) => (
                    <div key={i} className="afi-action-card__obs-line">
                      {item?.label ? (
                        <>
                          <span className="afi-action-card__obs-label">
                            {item.label}:
                          </span>{" "}
                          <span className="afi-action-card__obs-value">
                            {item.value}
                          </span>
                        </>
                      ) : (
                        <span className="afi-action-card__obs-value">
                          {item?.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="afi-action-card__footer">
                <div className="afi-action-card__footer-text">
                  Asesor:{" "}
                  {accion?.asesorNombreCompleto || accion?.asenum || "-"}
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
