import { mapFormularioItem } from "./forms.utils";

export default function FormulariosNotificacionesModal({
  show,
  items = [],
  loading = false,
  error = "",
  onClose,
  onMarcarLeida,
  savingId = "",
}) {
  const notificaciones = items.map(mapFormularioItem);

  return (
    <div className={`forms-noti-backdrop ${show ? "is-open" : ""}`} onClick={onClose}>
      <div className="forms-noti-modal" onClick={(e) => e.stopPropagation()}>
        <div className="forms-noti-header">
          <div>
            <div className="forms-noti-kicker">Notificaciones</div>
            <h3>Respuesta final de formularios</h3>
          </div>
          <button type="button" className="forms-modal-close" onClick={onClose} aria-label="Cerrar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="forms-noti-body">
          {loading ? (
            <div className="forms-noti-empty">Cargando notificaciones...</div>
          ) : error ? (
            <div className="forms-noti-empty is-error">{error}</div>
          ) : notificaciones.length === 0 ? (
            <div className="forms-noti-empty">No hay respuestas finales pendientes de leer.</div>
          ) : (
            notificaciones.map((it) => (
              <article className="forms-noti-card" key={it.id}>
                <div className="forms-noti-color" style={{ background: it.color, border: it.borderColor ? `1px solid ${it.borderColor}` : "none" }} />
                <div className="forms-noti-content">
                  <div className="forms-noti-title-row">
                    <strong>Formulario {it.id}</strong>
                    <span>{it.estadoTxt}</span>
                  </div>
                  <div className="forms-noti-meta">{it.fecha} {it.hora ? `- ${it.hora}` : ""}</div>
                  {it.detalleFormulario ? <div className="forms-noti-line">{it.detalleFormulario}</div> : null}
                  {it.proyectoTexto ? <div className="forms-noti-line">{it.proyectoTexto}</div> : null}
                  {it.asesorTexto ? <div className="forms-noti-line">{it.asesorTexto}</div> : null}
                  {it.estadoDetalle ? (
                    <div className="forms-noti-detail">
                      {String(it.estadoDetalle).split("\n").filter(Boolean).map((line) => <div key={line}>{line}</div>)}
                    </div>
                  ) : null}
                  <div className="forms-noti-actions">
                    <button type="button" className="forms-noti-read-btn" disabled={savingId === it.id} onClick={() => onMarcarLeida?.(it)}>
                      {savingId === it.id ? "Marcando..." : "Marcar como leída"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
