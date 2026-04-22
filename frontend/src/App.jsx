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
import Login from "./pages/Login.jsx";
import RequireAuth from "./components/auth/RequireAuth.jsx";
import { getConfiguracionGuardada } from "./components/configuracion/configuracion.utils";
import { getAuthSession } from "./components/auth/auth.storage.js";
import { logoutAsesor } from "./components/auth/auth.api.js";
import useInactivityLogout from "./hooks/useInactivityLogout.js";

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

function ProtectedRoute({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthSession()?.token));

  const navigate = useNavigate();
  const location = useLocation();

  useInactivityLogout(isAuthenticated && location.pathname !== "/login");

  useEffect(() => {
    const syncAuthState = () => setIsAuthenticated(Boolean(getAuthSession()?.token));
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth:expired", syncAuthState);
    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth:expired", syncAuthState);
    };
  }, []);

  useEffect(() => {
    setIsAuthenticated(Boolean(getAuthSession()?.token));
  }, [location.pathname]);

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

  const handleLogout = async () => {
    await logoutAsesor();
    setIsAuthenticated(false);
    closeDrawer();
    navigate("/login", { replace: true });
  };

  const asesorGuardado = getConfiguracionGuardada()?.asesorCodigo;
  const showShell = location.pathname !== "/login";
  const mainClassName = showShell ? "main" : "main main--public";

  return (
    <>
      {showShell ? (
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
                <div>Versión Web 1.0</div>
                <div>{isAuthenticated ? "Sesión activa" : "Sin sesión"}</div>
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

            {isAuthenticated ? (
              <div className="drawer__footer">
                <button type="button" className="drawer__logout" onClick={handleLogout}>
                  <span className="material-symbols-outlined">logout</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            ) : null}
          </aside>
        </>
      ) : null}

      <main className={mainClassName}>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                asesorGuardado ? <Navigate to="/afiliaciones" replace /> : <Navigate to="/configuracion" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="/login" element={<Login />} />

          <Route path="/actividad" element={<ProtectedRoute><Actividad /></ProtectedRoute>} />
          <Route path="/cedula" element={<ProtectedRoute><SoloCedula /></ProtectedRoute>} />
          <Route path="/afiliaciones" element={<ProtectedRoute><Afiliaciones /></ProtectedRoute>} />
          <Route path="/analisis" element={<ProtectedRoute><Analisis /></ProtectedRoute>} />
          <Route path="/formularios" element={<ProtectedRoute><Formularios /></ProtectedRoute>} />
          <Route path="/proyectos" element={<ProtectedRoute><Proyectos /></ProtectedRoute>} />
          <Route path="/estadisticas" element={<ProtectedRoute><Estadisticas /></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}