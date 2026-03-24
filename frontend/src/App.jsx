import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Actividad from "./pages/Actividad.jsx";
import SoloCedula from "./pages/SoloCedula.jsx";
import Afiliaciones from "./pages/Afiliaciones.jsx";
import Analisis from "./pages/Analisis.jsx";
import Formularios from "./pages/Formularios.jsx";
import Proyectos from "./pages/Proyectos.jsx";
import Estadisticas from "./pages/Estadisticas.jsx";
import Configuracion from "./pages/Configuracion.jsx";
import { getConfiguracionGuardada } from "./components/configuracion/configuracion.utils";

const MENU = [
  { key: "inicio", label: "Inicio", icon: "home", path: "/" },
  { key: "actividad", label: "Actividad", icon: "work", path: "/actividad" },
  { key: "cedula", label: "Sólo cédula", icon: "person", path: "/cedula" },
  { key: "afiliaciones", label: "Afiliaciones", icon: "badge", path: "/afiliaciones" },
  { key: "analisis", label: "Análisis", icon: "bar_chart", path: "/analisis" },
  { key: "formularios", label: "Formularios", icon: "sync_alt", path: "/formularios" },
  { key: "proyectos", label: "Proyectos", icon: "assignment", path: "/proyectos" },
  { key: "estadisticas", label: "Estadísticas", icon: "trending_up", path: "/estadisticas" },
  { key: "config", label: "Configuración", icon: "settings", path: "/configuracion" },
];

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const activeItem = useMemo(() => {
    return MENU.find((m) => m.path === location.pathname) ?? MENU[0];
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  const handleMenuClick = (path) => {
    navigate(path);
    closeDrawer();
  };

  const asesorGuardado = getConfiguracionGuardada()?.asesorCodigo;

  return (
    <>
      <header className="topbar topbar--mobile-logo">
        <button
          className="icon-btn topbar__menu"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="topbar__brand" aria-label="Integración AFAP">
          <img
            src="/Colores-horizontal-01.png"
            alt="Integración AFAP"
            className="topbar__logo"
          />
        </div>
      </header>

      <div className="overlay" hidden={!drawerOpen} onClick={closeDrawer} />

      <aside className={`drawer ${drawerOpen ? "is-open" : ""}`} aria-label="Menú">
        <div className="drawer__header">
          <div className="brand--logo-only">
            <img
              src="/Colores-horizontal-01.png"
              alt="Integración AFAP"
              className="brand__logo-full"
            />
          </div>

          <div className="meta">
            <div>Id: 5305c879363a050a</div>
            <div>Versión Web 1.0</div>
          </div>
        </div>

        <nav className="menu">
          {MENU.map((item) => (
            <a
              key={item.key}
              className={`menu__item ${activeItem.key === item.key ? "is-active" : ""}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleMenuClick(item.path);
              }}
            >
              <span className="menu__icon material-symbols-outlined">{item.icon}</span>
              <span className="menu__label">{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              asesorGuardado ? (
                <Navigate to="/afiliaciones" replace />
              ) : (
                <Navigate to="/configuracion" replace />
              )
            }
          />

          <Route path="/actividad" element={<Actividad />} />
          <Route path="/cedula" element={<SoloCedula />} />
          <Route path="/afiliaciones" element={<Afiliaciones />} />
          <Route path="/analisis" element={<Analisis />} />
          <Route path="/formularios" element={<Formularios />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Routes>
      </main>
    </>
  );
}