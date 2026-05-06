export default function FotoTab({
  title,
  helpText = "",
  value = "",
  onChange,
  accept = "image/*",
  capture,
}) {
  const handleFile = (file) => {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      window.alert("El archivo seleccionado debe ser una imagen.");
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      window.alert("La imagen supera el máximo permitido de 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result || "");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="forms-foto-tab">
      <div className="forms-foto-tab__header">
        <div className="forms-foto-tab__title">{title}</div>
        {helpText ? <div className="forms-foto-tab__help">{helpText}</div> : null}
      </div>

      <div className="forms-foto-tab__preview">
        {value ? (
          <img src={value} alt={title} className="forms-foto-tab__img" />
        ) : (
          <div className="forms-foto-tab__empty">
            <span className="material-symbols-outlined">photo_camera</span>
            <span>Sin imagen cargada</span>
          </div>
        )}
      </div>

      <div className="forms-foto-tab__actions">
        <label className="forms-foto-tab__button">
          <span className="material-symbols-outlined">photo_camera</span>
          Tomar foto
          <input
            type="file"
            accept={accept}
            capture={capture || "environment"}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        <label className="forms-foto-tab__button">
          <span className="material-symbols-outlined">upload_file</span>
          Cargar archivo
          <input
            type="file"
            accept={accept}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        {value ? (
          <button
            type="button"
            className="forms-foto-tab__button is-danger"
            onClick={() => onChange("")}
          >
            <span className="material-symbols-outlined">delete</span>
            Quitar
          </button>
        ) : null}
      </div>
    </div>
  );
}
