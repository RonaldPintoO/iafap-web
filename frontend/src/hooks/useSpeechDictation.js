import { useEffect, useMemo, useRef, useState } from "react";

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function useSpeechDictation({ onResult, lang = "es-UY" } = {}) {
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const [listening, setListening] = useState(false);
  const supported = useMemo(() => Boolean(getSpeechRecognition()), []);
  const [error, setError] = useState("");

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) return undefined;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      if (transcript && typeof onResultRef.current === "function") {
        onResultRef.current(transcript);
      }
    };

    recognition.onerror = (event) => {
      const code = event?.error || "";
      if (code === "not-allowed" || code === "service-not-allowed") {
        setError("Permiso de micrófono denegado.");
      } else if (code === "no-speech") {
        setError("No se detectó voz. Intentá nuevamente.");
      } else {
        setError("No se pudo usar el dictado.");
      }
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current = null;
      try {
        recognition.abort();
      } catch {
        // No hacer nada: algunos navegadores lanzan error si ya está detenido.
      }
    };
  }, [lang]);

  const controls = useMemo(
    () => ({
      supported,
      listening,
      error,
      start: () => {
        setError("");

        if (!supported || !recognitionRef.current) {
          setError("El navegador no soporta dictado por voz.");
          return;
        }

        try {
          recognitionRef.current.start();
          setListening(true);
        } catch {
          try {
            recognitionRef.current.stop();
          } catch {
            // No hacer nada.
          }
          setListening(false);
        }
      },
      stop: () => {
        try {
          recognitionRef.current?.stop();
        } catch {
          // No hacer nada.
        }
        setListening(false);
      },
      clearError: () => setError(""),
    }),
    [supported, listening, error],
  );

  return controls;
}
