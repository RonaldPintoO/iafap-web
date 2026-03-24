import { useEffect, useMemo, useRef, useState } from "react";
import Tabs from "../components/proyectos/Tabs";
import FabButton from "../components/proyectos/FabButton";
import Modal from "../components/proyectos/Modal";
import CombustibleSection from "../components/proyectos/CombustibleSection";
import AlquilerSection from "../components/proyectos/AlquilerSection";
import AdelantosSection from "../components/proyectos/AdelantosSection";
import { BaseField } from "../components/proyectos/BaseField";
import {
  FICHA_MENOS_100,
  FICHA_MAS_100,
  onlyDigits,
  getRentStatusStyle,
  isMobileDevice,
  isoToDDMMYYYY,
  ddmmyyyyToISO,
  normalizePlate,
  formatPlate,
  normalizeTimeHHMM,
  formatAdvanceAmountInput,
  parseAdvanceAmount,
  calcAdvanceTokens,
} from "../components/proyectos/proyectos.utils";

const TABS = [
  { id: "mis", label: "Mis Proyectos" },
  { id: "combustible", label: "Combustible" },
  { id: "alquiler", label: "Alquiler" },
  { id: "adelantos", label: "Adelantos" },
];

const PROYECTOS_DEMO = [
  "3007-PRO-SCG 4199 02/03/20..",
  "3064-PRO-SDD 4937 14/01/26..",
  "3075-PRO-SDA 5511 14/11/25..",
];

export default function Proyectos() {
  const [tab, setTab] = useState("mis");

  // ===== Combustible
  const [mode, setMode] = useState(null);
  const [fuelTab, setFuelTab] = useState("combustible");
  const [proyecto, setProyecto] = useState(PROYECTOS_DEMO[0]);
  const [rut, setRut] = useState("");
  const [boleta, setBoleta] = useState("");
  const [fechaISO, setFechaISO] = useState("");
  const [importe, setImporte] = useState("");
  const [fuelImage, setFuelImage] = useState(null);
  const qrCamRef = useRef(null);
  const qrFileRef = useRef(null);
  const photoCamRef = useRef(null);
  const photoFileRef = useRef(null);

  // ===== Alquiler
  const [rentMode, setRentMode] = useState(null);
  const [rentList, setRentList] = useState([
    {
      id: "r1",
      estado: "Con",
      desdeISO: "2022-08-29",
      hastaISO: "2022-08-31",
      departamentos: "Lavalleja",
      adelanto: "5000",
      fichas: "15",
      retiro: {
        fechaISO: "2022-08-26",
        hora: "00:00",
        km: "300000",
        plateRaw: "SCK2079",
        foto: null,
      },
      devolucion: {
        fechaISO: "2022-08-26",
        hora: "10:43",
        km: "350000",
        plateRaw: "SCK2079",
        foto: null,
      },
    },
  ]);
  const [rentActiveId, setRentActiveId] = useState(null);
  const [rentStep, setRentStep] = useState("retiro");
  const [rentSubTab, setRentSubTab] = useState("form");
  const rentCamRef = useRef(null);
  const rentFileRef = useRef(null);

  // ===== Adelantos
  const [advanceList, setAdvanceList] = useState([
    {
      id: "a1",
      fechaISO: "2022-10-19",
      importe: 2530,
      observacion: "Montevideo, Canelones",
      estado: "Con",
    },
    {
      id: "a2",
      fechaISO: "2022-10-17",
      importe: 2530,
      observacion: "Colonia",
      estado: "Den",
    },
    {
      id: "a3",
      fechaISO: "2022-07-12",
      importe: 7000,
      observacion: "Lavalleja",
      estado: "Con",
    },
  ]);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceImporte, setAdvanceImporte] = useState("");
  const [advanceObs, setAdvanceObs] = useState("");

  // ===== Modal general
  const [modal, setModal] = useState(null);

  const isFuel = tab === "combustible";
  const isRent = tab === "alquiler";
  const isAdvance = tab === "adelantos";

  const canGoFotoManual = useMemo(() => {
    const rutOk = onlyDigits(rut).length === 12;
    const boletaOk = onlyDigits(boleta).length > 0;
    const fechaOk = !!fechaISO;
    const num = parseFloat(String(importe).replace(",", "."));
    const importeOk = Number.isFinite(num) && num > 0;
    return rutOk && boletaOk && fechaOk && importeOk;
  }, [rut, boleta, fechaISO, importe]);

  const rentActive = useMemo(
    () => rentList.find((x) => x.id === rentActiveId) || null,
    [rentList, rentActiveId]
  );

  const showError = (message) => {
    setModal({
      title: "Error",
      content: message,
      actions: [{ label: "Ok", onClick: () => setModal(null) }],
    });
  };

  const showAlert = (message, onOk) => {
    setModal({
      title: "Alerta",
      content: message,
      actions: [
        {
          label: "Ok",
          onClick: () => {
            setModal(null);
            onOk?.();
          },
        },
      ],
    });
  };

  const setPreviewImage = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFuelImage((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { file, url };
    });
  };

  const resetFuel = () => {
    setMode(null);
    setFuelTab("combustible");
    setProyecto(PROYECTOS_DEMO[0]);
    setRut("");
    setBoleta("");
    setFechaISO("");
    setImporte("");
    setFuelImage((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setModal(null);
  };

  const resetRent = () => {
    setRentMode(null);
    setRentActiveId(null);
    setRentStep("retiro");
    setRentSubTab("form");
    setModal(null);
  };

  const resetAdvance = () => {
    setAdvanceModalOpen(false);
    setAdvanceImporte("");
    setAdvanceObs("");
  };

  useEffect(() => {
    if (tab !== "combustible") resetFuel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== "alquiler") resetRent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== "adelantos") resetAdvance();
  }, [tab]);

  const openMetodoModal = () => {
    setModal({
      title: "Alerta",
      content: "¿Desea leer el código qr de la boleta o ingresar la información manualmente?",
      actions: [
        { label: "Cancelar", onClick: () => setModal(null) },
        {
          label: "Manual",
          onClick: () => {
            setModal(null);
            setMode("manual");
            setFuelTab("combustible");
          },
        },
        {
          label: "Leer qr",
          onClick: () => {
            setModal(null);

            if (isMobileDevice()) {
              qrCamRef.current?.click();
              return;
            }

            setModal({
              title: "Alerta",
              content:
                "La lectura de qr requiere cámara y está pensada para celular. ¿Desea cargar una imagen del qr desde el equipo?",
              actions: [
                { label: "Cancelar", onClick: () => setModal(null) },
                {
                  label: "Cargar imagen",
                  onClick: () => {
                    setModal(null);
                    qrFileRef.current?.click();
                  },
                },
              ],
            });
          },
        },
      ],
    });
  };

  const onQRPicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPreviewImage(file);
    setMode("qr");
    setFuelTab("combustible");
    setProyecto(PROYECTOS_DEMO[0]);
    setRut("214748364812");
    setBoleta("123456");
    setFechaISO(ddmmyyyyToISO("02/03/2020") || "2020-03-02");
    setImporte("1500");
  };

  const onPhotoPicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPreviewImage(file);
  };

  const onSiguiente = () => {
    if (onlyDigits(rut).length !== 12) return showError("El rut debe tener 12 dígitos");
    if (onlyDigits(boleta).length === 0) return showError("Debe ingresar el nro. de boleta");
    if (!fechaISO) return showError("Debe ingresar la fecha");
    const num = parseFloat(String(importe).replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) return showError("El importe debe ser mayor que 0");
    setFuelTab("foto");
  };

  const onClickFotoTab = () => {
    if (mode === "manual" && !canGoFotoManual) {
      if (onlyDigits(rut).length !== 12) return showError("El rut debe tener 12 dígitos");
      if (onlyDigits(boleta).length === 0) return showError("Debe ingresar el nro. de boleta");
      if (!fechaISO) return showError("Debe ingresar la fecha");
      return showError("El importe debe ser mayor que 0");
    }
    setFuelTab("foto");
  };

  const onEnviar = () => {
    if (onlyDigits(rut).length !== 12) return showError("El rut debe tener 12 dígitos");
    if (onlyDigits(boleta).length === 0) return showError("Debe ingresar el nro. de boleta");
    if (!fechaISO) return showError("Debe ingresar la fecha");
    const num = parseFloat(String(importe).replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) return showError("El importe debe ser mayor que 0");
    if (!fuelImage?.file) return showError("Debe adjuntar una foto para enviar");

    console.log("[Combustible] Enviar (demo):", {
      mode,
      proyecto,
      rut,
      boleta,
      fecha: isoToDDMMYYYY(fechaISO),
      fechaISO,
      importe,
      foto: fuelImage.file?.name,
    });

    showAlert("Enviado (demo).", resetFuel);
  };

  /** ===== Alquiler ===== */
  const openRentNew = () => {
    const id = `r${Date.now()}`;
    const nuevo = {
      id,
      estado: "Env",
      desdeISO: "",
      hastaISO: "",
      departamentos: "",
      adelanto: "",
      fichas: "",
      retiro: { fechaISO: "", hora: "", km: "", plateRaw: "", foto: null },
      devolucion: { fechaISO: "", hora: "", km: "", plateRaw: "", foto: null },
    };
    setRentList((prev) => [nuevo, ...prev]);
    setRentActiveId(id);
    setRentMode("detalle");
    setRentStep("retiro");
    setRentSubTab("form");
  };

  const openRentStep = (id, step) => {
    setRentActiveId(id);
    setRentMode("detalle");
    setRentStep(step);
    setRentSubTab("form");
  };

  const updateRentStep = (step, patch) => {
    if (!rentActiveId) return;
    setRentList((prev) =>
      prev.map((r) => {
        if (r.id !== rentActiveId) return r;
        return { ...r, [step]: { ...r[step], ...patch } };
      })
    );
  };

  const setRentPhoto = (file) => {
    if (!rentActiveId || !file) return;

    const url = URL.createObjectURL(file);

    setRentList((prev) =>
      prev.map((r) => {
        if (r.id !== rentActiveId) return r;

        const curr = r[rentStep]?.foto;
        if (curr?.url) URL.revokeObjectURL(curr.url);

        return { ...r, [rentStep]: { ...r[rentStep], foto: { file, url } } };
      })
    );
  };

  const onRentPhotoPicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setRentPhoto(file);
  };

  const validateRentStep = () => {
    if (!rentActive) return false;
    const s = rentActive[rentStep];

    if (!s.fechaISO) return showError("Debe ingresar la fecha");
    if (!s.hora) return showError("Debe ingresar la hora");

    const km = parseInt(onlyDigits(s.km), 10);
    if (!Number.isFinite(km) || km <= 0) {
      return showError("Los kilómetros deben ser numéricos");
    }

    if (!formatPlate(s.plateRaw) || formatPlate(s.plateRaw).length < 3) {
      return showError("Debe ingresar la matrícula");
    }

    return true;
  };

  const onRentEnviar = () => {
    if (!rentActive) return;
    if (!validateRentStep()) return;

    const s = rentActive[rentStep];
    if (!s.foto?.file) return showError("Debe adjuntar una foto para enviar");

    console.log("[Alquiler] Enviar (demo):", {
      solicitudId: rentActive.id,
      step: rentStep,
      fechaISO: s.fechaISO,
      hora: s.hora,
      km: onlyDigits(s.km),
      matricula: formatPlate(s.plateRaw),
      foto: s.foto.file.name,
    });

    showAlert("Enviado (demo).", () => {
      setRentMode(null);
      setRentActiveId(null);
      setRentStep("retiro");
      setRentSubTab("form");
    });
  };

  /** ===== Adelantos ===== */
  const onAdvanceConfirm = () => {
    const importeNum = parseAdvanceAmount(advanceImporte);
    if (!importeNum || importeNum <= 0) return showError("Debe ingresar un importe válido");

    const nuevo = {
      id: `a${Date.now()}`,
      fechaISO: new Date().toISOString().slice(0, 10),
      importe: importeNum,
      observacion: advanceObs.trim(),
      estado: "Env",
    };

    setAdvanceList((prev) => [nuevo, ...prev]);
    resetAdvance();
  };

  return (
    <div className="proj-page">
      <Tabs
        tabs={TABS}
        active={tab}
        onChange={setTab}
        ariaLabel="Proyectos tabs"
      />

      <div className="proj-body">
        {tab === "mis" && (
          <div className="proj-empty">
            (Pendiente) Contenido de: <b>{TABS.find((x) => x.id === tab)?.label}</b>
          </div>
        )}

        {isFuel && (
          <>
            <CombustibleSection
              mode={mode}
              fuelTab={fuelTab}
              setFuelTab={setFuelTab}
              proyecto={proyecto}
              setProyecto={setProyecto}
              proyectosDemo={PROYECTOS_DEMO}
              rut={rut}
              setRut={setRut}
              boleta={boleta}
              setBoleta={setBoleta}
              fechaISO={fechaISO}
              setFechaISO={setFechaISO}
              importe={importe}
              setImporte={setImporte}
              fuelImage={fuelImage}
              onClickFotoTab={onClickFotoTab}
              onSiguiente={onSiguiente}
              onEnviar={onEnviar}
              resetFuel={resetFuel}
              photoCamRef={photoCamRef}
              photoFileRef={photoFileRef}
              onlyDigits={onlyDigits}
            />

            {mode === null && (
              <FabButton onClick={openMetodoModal} label="Agregar" icon="add" />
            )}

            <input
              ref={qrCamRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={onQRPicked}
            />
            <input
              ref={qrFileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={onQRPicked}
            />
            <input
              ref={photoCamRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={onPhotoPicked}
            />
            <input
              ref={photoFileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={onPhotoPicked}
            />
          </>
        )}

        {isRent && (
          <AlquilerSection
            rentMode={rentMode}
            rentList={rentList}
            rentActive={rentActive}
            rentStep={rentStep}
            rentSubTab={rentSubTab}
            setRentSubTab={setRentSubTab}
            openRentNew={openRentNew}
            openRentStep={openRentStep}
            getStatusStyle={getRentStatusStyle}
            isoToDDMMYYYY={isoToDDMMYYYY}
            updateRentStep={updateRentStep}
            normalizeTimeHHMM={normalizeTimeHHMM}
            onlyDigits={onlyDigits}
            formatPlate={formatPlate}
            normalizePlate={normalizePlate}
            validateRentStep={validateRentStep}
            showAlert={showAlert}
            setRentMode={setRentMode}
            setRentActiveId={setRentActiveId}
            setRentStep={setRentStep}
            setRentSubTabForm={setRentSubTab}
            rentCamRef={rentCamRef}
            rentFileRef={rentFileRef}
            onRentPhotoPicked={onRentPhotoPicked}
            onRentEnviar={onRentEnviar}
          />
        )}

        {isAdvance && (
          <>
            <AdelantosSection
              advanceList={advanceList}
              getStatusStyle={getRentStatusStyle}
              isoToDDMMYYYY={isoToDDMMYYYY}
              calcAdvanceTokens={calcAdvanceTokens}
              fichaMenos100={FICHA_MENOS_100}
              fichaMas100={FICHA_MAS_100}
              onAdd={() => setAdvanceModalOpen(true)}
            />
          </>
        )}
      </div>

      {modal && (
        <Modal
          title={modal.title}
          onClose={() => setModal(null)}
          actions={modal.actions}
        >
          {modal.content}
        </Modal>
      )}

      {advanceModalOpen && (
        <Modal
          title="Indique el valor a solicitar"
          onClose={() => setAdvanceModalOpen(false)}
          actions={[
            {
              label: "Cancelar",
              onClick: () => setAdvanceModalOpen(false),
            },
            {
              label: "Confirmar",
              onClick: onAdvanceConfirm,
            },
          ]}
        >
          <div style={{ marginTop: 22 }}>
            <BaseField
              label="Importe"
              value={advanceImporte}
              onChange={(v) => setAdvanceImporte(formatAdvanceAmountInput(v))}
              inputMode="numeric"
            />

            <BaseField
              label="Observación"
              value={advanceObs}
              onChange={setAdvanceObs}
              inputMode="text"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}