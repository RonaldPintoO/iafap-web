import { useState } from "react";

const INITIAL_PERSONA_FORM = {
  ci: "",
  nombre: "",
  apellido: "",
  telefono: "",
};

export default function useAddPersonaModal() {
  const [showAddPersona, setShowAddPersona] = useState(false);
  const [personaForm, setPersonaForm] = useState(INITIAL_PERSONA_FORM);

  const setPersonaField = (key, value) => {
    setPersonaForm((prev) => ({ ...prev, [key]: value }));
  };

  const ciOk = personaForm.ci.length > 0 && /^\d+$/.test(personaForm.ci);
  const telOk =
    personaForm.telefono === "" || /^\d+$/.test(personaForm.telefono);
  const canSubmit =
    ciOk &&
    telOk &&
    personaForm.nombre.trim() !== "" &&
    personaForm.apellido.trim() !== "";

  const closeAddPersona = () => setShowAddPersona(false);

  const onSubmitPersona = () => {
    if (!canSubmit) return;
    setPersonaForm(INITIAL_PERSONA_FORM);
    closeAddPersona();
  };

  return {
    showAddPersona,
    setShowAddPersona,
    personaForm,
    setPersonaField,
    ciOk,
    telOk,
    canSubmit,
    closeAddPersona,
    onSubmitPersona,
  };
}
