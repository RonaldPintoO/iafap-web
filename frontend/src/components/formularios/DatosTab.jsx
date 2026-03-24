import { useMemo } from "react";
import FieldInput from "./FieldInput";
import FieldSelect from "./FieldSelect";
import FieldDate from "./FieldDate";

import {
  PROYECTOS_DEMO,
  DISTANCIAS,
  PAISES,
  DEPARTAMENTOS,
  TIPOS_DOC,
  CODIGO_CI,
  getLocalidadesByDepartamento,
  cleanNumbers,
  cleanAlphaNum,
  formatMoney,
  validarCedulaUruguaya,
} from "./forms.utils";

export default function DatosTab({ datos, setDatos }) {
  const set = (k, v) => setDatos((d) => ({ ...d, [k]: v }));

  const localidades = useMemo(
    () => getLocalidadesByDepartamento(datos.departamento),
    [datos.departamento]
  );

  const cedulaEsCI = datos.tipoDocumento === "CI";

  const cedulaValida =
    !cedulaEsCI ||
    datos.cedula.trim() === "" ||
    validarCedulaUruguaya(datos.cedula);

  const formatterDoc = cedulaEsCI ? cleanNumbers : cleanAlphaNum;

  const aplicaCodCI =
    datos.pais === "URUGUAY" && datos.tipoDocumento === "CI";

  const noAplicaCodCI = !aplicaCodCI;

  return (
    <div className="forms-datos">
      <div className="forms-datos-row two">
        <FieldSelect
          label="Proyecto"
          value={datos.proyecto}
          options={PROYECTOS_DEMO}
          onChange={(v) => set("proyecto", v)}
        />

        <FieldSelect
          label="Distancia"
          value={datos.distancia}
          options={DISTANCIAS}
          onChange={(v) => set("distancia", v)}
        />
      </div>

      <div className="forms-datos-row two">
        <FieldInput
          label="Asesor"
          value={datos.asesor}
          onChange={(v) => set("asesor", v)}
        />

        <FieldInput
          label="Asesor Form."
          value={datos.asesorForm}
          onChange={(v) => set("asesorForm", v)}
        />
      </div>

      <div className="forms-datos-row two">
        <FieldInput
          label="Formulario"
          value={datos.formulario}
          onChange={(v) => set("formulario", v)}
          formatter={cleanNumbers}
          inputMode="numeric"
        />

        <FieldDate
          label="Fecha Form"
          value={datos.fechaForm}
          onChange={(v) => set("fechaForm", v)}
        />
      </div>

      <div className="forms-datos-row one">
        <FieldSelect
          label="País"
          value={datos.pais}
          options={PAISES}
          onChange={(v) =>
            setDatos((d) => {
              const next = { ...d, pais: v };

              if (!(v === "URUGUAY" && d.tipoDocumento === "CI")) {
                next.codigoCI = "";
                next.serieCodCI = "";
                next.nroCodCI = "";
              }

              return next;
            })
          }
        />
      </div>

      <div className="forms-datos-row two">
        <FieldSelect
          label="Tipo Documento"
          value={datos.tipoDocumento}
          options={TIPOS_DOC}
          onChange={(v) =>
            setDatos((d) => {
              const next = {
                ...d,
                tipoDocumento: v,
                cedula: "",
              };

              if (!(d.pais === "URUGUAY" && v === "CI")) {
                next.codigoCI = "";
                next.serieCodCI = "";
                next.nroCodCI = "";
              }

              return next;
            })
          }
        />

        <FieldInput
          label="Documento"
          value={datos.cedula}
          onChange={(v) => set("cedula", v)}
          formatter={formatterDoc}
          inputMode={cedulaEsCI ? "numeric" : "text"}
          error={!cedulaValida}
        />
      </div>

      <div className="forms-datos-row two">
        <FieldSelect
          label="Código de CI"
          value={noAplicaCodCI ? "" : datos.codigoCI}
          options={CODIGO_CI}
          onChange={(v) => set("codigoCI", v)}
          disabled={noAplicaCodCI}
          placeholder={noAplicaCodCI ? "No aplica" : "Seleccionar"}
        />
        <div />
      </div>

      <div className="forms-datos-row three">
        <FieldInput
          label="Serie Cod CI"
          value={noAplicaCodCI ? "" : datos.serieCodCI}
          onChange={(v) => set("serieCodCI", v)}
          formatter={cleanAlphaNum}
          disabled={noAplicaCodCI}
          placeholder={noAplicaCodCI ? "No aplica" : ""}
        />

        <FieldInput
          label="Nro Cod CI"
          value={noAplicaCodCI ? "" : datos.nroCodCI}
          onChange={(v) => set("nroCodCI", v)}
          formatter={cleanNumbers}
          inputMode="numeric"
          disabled={noAplicaCodCI}
          placeholder={noAplicaCodCI ? "No aplica" : ""}
        />

        <div />
      </div>

      <div className="forms-datos-row three">
        <FieldDate
          label="Fecha Nac."
          value={datos.fechaNac}
          onChange={(v) => set("fechaNac", v)}
        />

        <FieldInput
          label="Teléfono"
          value={datos.telefono}
          onChange={(v) => set("telefono", v)}
          formatter={cleanNumbers}
          inputMode="numeric"
        />

        <FieldInput
          label="Celular"
          value={datos.celular}
          onChange={(v) => set("celular", v)}
          formatter={cleanNumbers}
          inputMode="numeric"
        />
      </div>

      <div className="forms-datos-row two">
        <FieldInput
          label="Empresa"
          value={datos.empresa}
          onChange={(v) => set("empresa", v)}
        />

        <FieldInput
          label="Sueldo"
          value={datos.sueldo}
          onChange={(v) => set("sueldo", v)}
          formatter={formatMoney}
          inputMode="numeric"
        />
      </div>

      <div className="forms-datos-row one">
        <FieldInput
          label="Mail"
          value={datos.mail}
          onChange={(v) => set("mail", v)}
        />
      </div>

      <div className="forms-datos-row one">
        <FieldInput
          label="Calle"
          value={datos.calle}
          onChange={(v) => set("calle", v)}
        />
      </div>

      <div className="forms-datos-row three">
        <FieldInput
          label="Número de Puerta"
          value={datos.nro}
          onChange={(v) => set("nro", v)}
        />

        <FieldInput
          label="Apartamento"
          value={datos.apto}
          onChange={(v) => set("apto", v)}
        />

        <FieldInput
          label="Bis"
          value={datos.bis}
          onChange={(v) => set("bis", v)}
        />
      </div>

      <div className="forms-datos-row one">
        <FieldSelect
          label="Departamento"
          value={datos.departamento}
          options={DEPARTAMENTOS}
          onChange={(v) =>
            setDatos((d) => ({
              ...d,
              departamento: v,
              localidad: "",
            }))
          }
        />
      </div>

      <div className="forms-datos-row one">
        <FieldSelect
          label="Localidad"
          value={datos.localidad}
          options={localidades}
          onChange={(v) => set("localidad", v)}
          disabled={!datos.departamento}
          placeholder={
            !datos.departamento ? "Seleccionar departamento" : "Seleccionar"
          }
        />
      </div>
    </div>
  );
}