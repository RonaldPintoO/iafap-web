import { useEffect, useMemo, useState } from "react";
import useSpeechDictation from "../../../hooks/useSpeechDictation";

const EMPTY_FORM = {
  acctipo: "",
  restipo: "",
  resnum: "",
  accvaluacion: 0,
  accobs: "",
  accdirnvo: "",
  acctelnvo: "",
  acccontactoFecha: "",
  acccontactoHora: "",
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function appendDictationText(current, text) {
  const prev = String(current || "").trimEnd();
  const next = String(text || "").trim();
  if (!next) return current || "";
  return prev ? `${prev} ${next}` : next;
}

function buildPersonaNombre(item) {
  const nombre = String(item?.nombreCompleto || "").trim();
  if (nombre) return nombre;

  return [
    item?.primerNombre,
    item?.segundoNombre,
    item?.primerApellido,
    item?.segundoApellido,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

function formatNow() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function splitAgendaValue(value) {
  const text = String(value || "").trim().replace(" ", "T");
  if (!text) return { fecha: "", hora: "" };

  const [fecha = "", horaRaw = ""] = text.split("T");
  return {
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : "",
    hora: /^\d{2}:\d{2}/.test(horaRaw) ? horaRaw.slice(0, 5) : "",
  };
}

function joinAgendaValue(fecha, hora) {
  const f = String(fecha || "").trim();
  const h = String(hora || "").trim();
  if (!f || !h) return "";
  return `${f}T${h}`;
}

function accionToForm(accion, tipos) {
  if (!accion) {
    return {
      ...EMPTY_FORM,
      acctipo: tipos[0]?.ta_num || "",
    };
  }

  const agenda = splitAgendaValue(accion.acccontacto);

  return {
    acctipo: accion.acctipo || tipos[0]?.ta_num || "",
    restipo:
      accion.restipo === 0 || accion.restipo === 1 ? String(accion.restipo) : "",
    resnum: accion.resnum || "",
    accvaluacion: Number(accion.accvaluacion) || 0,
    accobs: String(accion.accobs || ""),
    accdirnvo: String(accion.accdirnvo || ""),
    acctelnvo: String(accion.acctelnvo || "").trim(),
    acccontactoFecha: agenda.fecha,
    acccontactoHora: agenda.hora,
  };
}

export default function AccionPersonaModal({
  show,
  mode = "create",
  item,
  accion,
  catalogos,
  loadingCatalogos,
  errorCatalogos,
  saving,
  error,
  onClose,
  onSave,
  onReloadCatalogos,
}) {
  const isEdit = mode === "edit" && Boolean(accion?.accnum);
  const [form, setForm] = useState(EMPTY_FORM);
  const [openMenu, setOpenMenu] = useState(null);
  const [fechaTexto, setFechaTexto] = useState(() => formatNow());

  const tipos = useMemo(
    () => (Array.isArray(catalogos?.tipos) ? catalogos.tipos : []),
    [catalogos],
  );
  const resultados = useMemo(
    () => (Array.isArray(catalogos?.resultados) ? catalogos.resultados : []),
    [catalogos],
  );

  const resultadosFiltrados = useMemo(() => {
    const tipo = form.restipo;
    if (tipo === "" || tipo === null || tipo === undefined) return resultados;
    return resultados.filter((row) => String(row.restipo) === String(tipo));
  }, [resultados, form.restipo]);

  const tipoSeleccionado = tipos.find(
    (row) => String(row.ta_num) === String(form.acctipo),
  );

  const estadoSeleccionado =
    form.restipo === "1" ? "FINALIZADO" : form.restipo === "0" ? "PENDIENTE" : "";

  const resultadoSeleccionado = resultados.find(
    (row) => String(row.resnum) === String(form.resnum),
  );

  const resultadoNorm = normalizeText(resultadoSeleccionado?.resnom);
  const mostrarDireccionNueva =
    resultadoNorm === "DIRECCION NUEVA" || resultadoNorm === "MAIL NUEVO";
  const mostrarTelefonoNuevo = resultadoNorm === "TELEFONO INCORRECTO";
  const mostrarAgenda = Number(resultadoSeleccionado?.resagendar) === 1;

  const dictation = useSpeechDictation({
    onResult: (text) => {
      setForm((prev) => ({
        ...prev,
        accobs: appendDictationText(prev.accobs, text),
      }));
    },
  });

  useEffect(() => {
    if (!show) return;

    setFechaTexto(formatNow());
    setForm(accionToForm(isEdit ? accion : null, tipos));
    setOpenMenu(null);
  }, [show, isEdit, accion, tipos]);

  useEffect(() => {
    if (!show) return;
    if (!form.acctipo && tipos[0]?.ta_num) {
      setForm((prev) => ({ ...prev, acctipo: tipos[0].ta_num }));
    }
  }, [show, tipos, form.acctipo]);

  useEffect(() => {
    if (!show) return;
    if (
      form.resnum &&
      !resultadosFiltrados.some((row) => String(row.resnum) === String(form.resnum))
    ) {
      setForm((prev) => ({ ...prev, resnum: "" }));
    }
  }, [show, form.resnum, resultadosFiltrados]);

  if (!show) return null;

  const personaNombre = buildPersonaNombre(item) || "Persona";

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectTipo = (row) => {
    setField("acctipo", row.ta_num);
    setOpenMenu(null);
  };

  const handleSelectEstado = (value) => {
    setForm((prev) => ({
      ...prev,
      restipo: value,
      resnum: "",
      accdirnvo: "",
      acctelnvo: "",
      acccontactoFecha: "",
      acccontactoHora: "",
    }));
    setOpenMenu(null);
  };

  const handleSelectResultado = (row) => {
    setForm((prev) => ({
      ...prev,
      resnum: row.resnum,
      accdirnvo: "",
      acctelnvo: "",
      acccontactoFecha: "",
      acccontactoHora: "",
    }));
    setOpenMenu(null);
  };

  const canSave =
    Boolean(form.acctipo) &&
    form.restipo !== "" &&
    Boolean(form.resnum) &&
    (!mostrarDireccionNueva || form.accdirnvo.trim() !== "") &&
    (!mostrarTelefonoNuevo || form.acctelnvo.trim() !== "") &&
    (!mostrarAgenda || (form.acccontactoFecha.trim() !== "" && form.acccontactoHora.trim() !== ""));

  const handleSubmit = () => {
    if (!canSave || saving) return;

    onSave?.({
      acctipo: Number(form.acctipo),
      resnum: Number(form.resnum),
      accobs: form.accobs.trim(),
      accdirnvo: mostrarDireccionNueva ? form.accdirnvo.trim() : "",
      acctelnvo: mostrarTelefonoNuevo ? form.acctelnvo.trim() : "",
      acccontacto: mostrarAgenda ? joinAgendaValue(form.acccontactoFecha, form.acccontactoHora) : "",
      accvaluacion: Number(form.accvaluacion) || 0,
    });
  };

  return (
    <div className="afi-action-modal-backdrop is-open" onClick={onClose}>
      <div className={`afi-action-modal ${mostrarAgenda ? "has-agenda" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="afi-action-modal__body">
          <h2 className="afi-action-modal__title">{personaNombre}</h2>
          <div className="afi-action-modal__date">
            {isEdit ? "Editando acción" : `Fecha actual ${fechaTexto}`}
          </div>

          {loadingCatalogos ? (
            <div className="afi-action-modal__message">Cargando opciones...</div>
          ) : errorCatalogos ? (
            <div className="afi-action-modal__message is-error">
              {errorCatalogos}
              <button
                type="button"
                className="afi-action-modal__retry"
                onClick={onReloadCatalogos}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              <div className="afi-action-modal__field">
                <button
                  type="button"
                  className="afi-action-modal__select"
                  onClick={() => setOpenMenu((prev) => (prev === "tipo" ? null : "tipo"))}
                >
                  <span>{tipoSeleccionado?.ta_nom || "Tipo"}</span>
                  <span className="material-symbols-outlined">arrow_drop_down</span>
                </button>
                {openMenu === "tipo" ? (
                  <div className="afi-action-modal__menu">
                    {tipos.map((row) => (
                      <button
                        type="button"
                        key={row.ta_num}
                        className="afi-action-modal__menu-item"
                        onClick={() => handleSelectTipo(row)}
                      >
                        {row.ta_nom}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="afi-action-modal__field">
                <button
                  type="button"
                  className="afi-action-modal__select"
                  onClick={() => setOpenMenu((prev) => (prev === "estado" ? null : "estado"))}
                >
                  <span>{estadoSeleccionado || "Estado"}</span>
                  <span className="material-symbols-outlined">arrow_drop_down</span>
                </button>
                {openMenu === "estado" ? (
                  <div className="afi-action-modal__menu">
                    <button
                      type="button"
                      className="afi-action-modal__menu-item"
                      onClick={() => handleSelectEstado("0")}
                    >
                      PENDIENTE
                    </button>
                    <button
                      type="button"
                      className="afi-action-modal__menu-item"
                      onClick={() => handleSelectEstado("1")}
                    >
                      FINALIZADO
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="afi-action-modal__field">
                <button
                  type="button"
                  className="afi-action-modal__select"
                  onClick={() => setOpenMenu((prev) => (prev === "resultado" ? null : "resultado"))}
                  disabled={form.restipo === ""}
                >
                  <span>{resultadoSeleccionado?.resnom || "Resultado"}</span>
                  <span className="material-symbols-outlined">arrow_drop_down</span>
                </button>
                {openMenu === "resultado" ? (
                  <div className="afi-action-modal__menu is-large is-resultado">
                    {resultadosFiltrados.map((row) => (
                      <button
                        type="button"
                        key={row.resnum}
                        className="afi-action-modal__menu-item"
                        onClick={() => handleSelectResultado(row)}
                      >
                        {row.resnom}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="afi-action-stars" aria-label="Valoración">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={`afi-action-stars__btn ${Number(form.accvaluacion) >= star ? "is-active" : ""}`}
                    onClick={() => setField("accvaluacion", star)}
                    aria-label={`${star} estrella${star === 1 ? "" : "s"}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div className="afi-action-modal__input-row">
                <div className="afi-action-modal__input-wrap">
                  <textarea
                    className="afi-action-modal__textarea"
                    placeholder="Observación"
                    value={form.accobs}
                    rows={mostrarAgenda ? 1 : 2}
                    onChange={(e) => setField("accobs", e.target.value)}
                  />
                  <div className="afi-action-modal__underline" />
                </div>

                <button
                  type="button"
                  className={`afi-action-modal__mic ${dictation.listening ? "is-listening" : ""}`}
                  onClick={dictation.listening ? dictation.stop : dictation.start}
                  title={dictation.supported ? "Dictar observación" : "Dictado no soportado"}
                >
                  <span className="material-symbols-outlined">
                    {dictation.listening ? "stop" : "mic"}
                  </span>
                </button>
              </div>

              {dictation.error ? (
                <div className="afi-action-modal__hint is-error">{dictation.error}</div>
              ) : null}

              {mostrarDireccionNueva ? (
                <div className="afi-action-modal__text-field">
                  <input
                    className="afi-action-modal__input"
                    placeholder={resultadoNorm === "MAIL NUEVO" ? "Mail nuevo" : "Nueva dirección"}
                    value={form.accdirnvo}
                    onChange={(e) => setField("accdirnvo", e.target.value)}
                    autoComplete="off"
                  />
                  <div className="afi-action-modal__underline" />
                </div>
              ) : null}

              {mostrarTelefonoNuevo ? (
                <div className="afi-action-modal__text-field">
                  <input
                    className="afi-action-modal__input"
                    placeholder="Teléfono nuevo"
                    value={form.acctelnvo}
                    onChange={(e) => setField("acctelnvo", e.target.value.replace(/\D/g, ""))}
                    autoComplete="off"
                    inputMode="numeric"
                  />
                  <div className="afi-action-modal__underline" />
                </div>
              ) : null}
              {mostrarAgenda ? (
                <div className="afi-action-modal__agenda-grid">
                  <div className="afi-action-modal__text-field afi-action-modal__agenda-field">
                    <label className="afi-action-modal__agenda-label" htmlFor="accion-agenda-fecha">
                      Fecha de agenda
                    </label>
                    <input
                      id="accion-agenda-fecha"
                      className="afi-action-modal__input"
                      type="date"
                      value={form.acccontactoFecha}
                      onChange={(e) => setField("acccontactoFecha", e.target.value)}
                    />
                    <div className="afi-action-modal__underline" />
                  </div>
                  <div className="afi-action-modal__text-field afi-action-modal__agenda-field">
                    <label className="afi-action-modal__agenda-label" htmlFor="accion-agenda-hora">
                      Hora
                    </label>
                    <input
                      id="accion-agenda-hora"
                      className="afi-action-modal__input"
                      type="time"
                      value={form.acccontactoHora}
                      onChange={(e) => setField("acccontactoHora", e.target.value)}
                    />
                    <div className="afi-action-modal__underline" />
                  </div>
                </div>
              ) : null}

              {error ? <div className="afi-action-modal__hint is-error">{error}</div> : null}
            </>
          )}
        </div>

        <div className="afi-action-modal__actions">
          <button type="button" className="afi-action-modal__button" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="afi-action-modal__button"
            onClick={handleSubmit}
            disabled={!canSave || saving || loadingCatalogos || Boolean(errorCatalogos)}
          >
            {saving ? "Guardando..." : isEdit ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
