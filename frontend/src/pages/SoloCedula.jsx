import { useState } from "react";

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

export default function SoloCedula() {
  const [cedula, setCedula] = useState("");

  function onChange(e) {
    const clean = onlyDigits(e.target.value).slice(0, 9); // 8-9 típico, dejamos max 9
    setCedula(clean);
  }

  function buscar() {
    if (!cedula) {
      alert("Ingresá una cédula.");
      return;
    }
    if (cedula.length < 7) {
      alert("La cédula parece incompleta (mínimo 7 dígitos).");
      return;
    }

    // Acá luego conectamos API
    console.log("Buscar cédula:", cedula);
    alert("Buscar (demo). Mirá la consola para ver la cédula.");
  }

  return (
    <div className="solo-page">
      <div className="solo-tabs">
        <button className="solo-tab is-active" type="button">
          Buscar Cédula
        </button>
        <div className="solo-tab-spacer" />
      </div>

      <div className="solo-content">
        <div className="solo-input-wrap">
          <input
            id="buscar-cedula"
            name="buscar_cedula"
            value={cedula}
            onChange={onChange}
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="Cédula"
          />
          <div className="solo-underline" />
        </div>

        <button className="solo-btn" type="button" onClick={buscar}>
          Buscar
        </button>
      </div>
    </div>
  );
}
