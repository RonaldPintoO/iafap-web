import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../../config/api";
import { getAsesorConfigurado } from "../shared/afiliacionesController.helpers";

export default function useAfiliacionesMap({ tab, topLocValue }) {
  const mapRef = useRef(null);
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [locMsg, setLocMsg] = useState("");

  const [mapPoints, setMapPoints] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");

  const [edadMinInput, setEdadMinInput] = useState("");
  const [edadMaxInput, setEdadMaxInput] = useState("");
  const [edadMinAplicada, setEdadMinAplicada] = useState("");
  const [edadMaxAplicada, setEdadMaxAplicada] = useState("");
  const [edadError, setEdadError] = useState("");
  const [tipoPersona, setTipoPersona] = useState("todos");

  const handleLocate = useCallback(() => {
    const map = mapRef.current;

    if (!map) {
      setLocStatus("error");
      setLocMsg("Mapa no listo");
      return;
    }

    if (!("geolocation" in navigator)) {
      setLocStatus("error");
      setLocMsg("Geolocalización no soportada");
      return;
    }

    const applyLocation = (latitude, longitude, zoom = 15) => {
      const next = { lat: latitude, lng: longitude };
      setUserLoc(next);

      map.flyTo([latitude, longitude], zoom, {
        animate: true,
        duration: 0.8,
      });
    };

    setLocStatus("loading");
    setLocMsg("Obteniendo ubicación...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        setLocStatus("ok");
        setLocMsg("");

        const zoom = accuracy && accuracy > 2000 ? 12 : 15;
        applyLocation(latitude, longitude, zoom);
      },
      (err) => {
        if (err.code === 1) {
          setLocStatus("error");
          setLocMsg("Permiso de ubicación denegado");
          return;
        }

        setLocMsg(
          err.code === 3
            ? "Tiempo de espera agotado, reintentando..."
            : "No se pudo obtener ubicación, reintentando...",
        );

        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            const { latitude, longitude, accuracy } = pos2.coords;

            setLocStatus("ok");
            setLocMsg("");

            const zoom = accuracy && accuracy > 2000 ? 12 : 15;
            applyLocation(latitude, longitude, zoom);
          },
          (err2) => {
            setLocStatus("error");

            if (err2.code === 1) setLocMsg("Permiso de ubicación denegado");
            else if (err2.code === 2) setLocMsg("Ubicación no disponible");
            else if (err2.code === 3) setLocMsg("Tiempo de espera agotado");
            else setLocMsg("No se pudo obtener ubicación");
          },
          {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 600000,
          },
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 600000,
      },
    );
  }, []);

  const handleApplyEdadFiltro = useCallback(() => {
    const min = edadMinInput.trim();
    const max = edadMaxInput.trim();

    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      setEdadError("La edad mínima no puede ser mayor que la máxima");
      return;
    }

    setEdadError("");
    setEdadMinAplicada(min);
    setEdadMaxAplicada(max);
  }, [edadMinInput, edadMaxInput]);

  const handleClearEdadFiltro = useCallback(() => {
    setEdadMinInput("");
    setEdadMaxInput("");
    setEdadMinAplicada("");
    setEdadMaxAplicada("");
    setEdadError("");
  }, []);

  useEffect(() => {
    setLocMsg("");
    if (locStatus !== "idle") setLocStatus("idle");
  }, [tab, locStatus]);

  useEffect(() => {
    if (tab !== "mapa") return;

    let cancelled = false;

    const fetchMap = async () => {
      try {
        setMapLoading(true);
        setMapError("");

        const asesorCodigo = getAsesorConfigurado();
        const params = new URLSearchParams();

        if (asesorCodigo) {
          params.set("asesor", asesorCodigo);
        }

        if (topLocValue && topLocValue !== "Todos") {
          params.set("localidad", topLocValue);
        }

        if (edadMinAplicada !== "") {
          params.set("edad_min", edadMinAplicada);
        }

        if (edadMaxAplicada !== "") {
          params.set("edad_max", edadMaxAplicada);
        }

        if (tipoPersona && tipoPersona !== "todos") {
          params.set("tipo_persona", tipoPersona);
        }

        const queryString = params.toString();
        const url = `/mapa${queryString ? `?${queryString}` : ""}`;

        const res = await apiFetch(url);
        if (!res.ok) throw new Error("No se pudo cargar el mapa");

        const data = await res.json();

        if (!cancelled) {
          setMapPoints(Array.isArray(data.points) ? data.points : []);
        }
      } catch (err) {
        if (!cancelled) {
          setMapError(err.message || "Error cargando mapa");
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false);
        }
      }
    };

    fetchMap();

    return () => {
      cancelled = true;
    };
  }, [tab, edadMinAplicada, edadMaxAplicada, tipoPersona, topLocValue]);

  return {
    mapRef,
    userLoc,
    locStatus,
    locMsg,
    handleLocate,
    mapPoints,
    mapLoading,
    mapError,
    edadMinInput,
    edadMaxInput,
    setEdadMinInput,
    setEdadMaxInput,
    handleApplyEdadFiltro,
    handleClearEdadFiltro,
    edadError,
    tipoPersona,
    setTipoPersona,
  };
}
