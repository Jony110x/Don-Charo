import React, { useState, useEffect } from "react";
import {
  Home,
  ShoppingCart,
  Package,
  BarChart3,
  LogOut,
  User as UserIcon,
  Smartphone,
  FileText,
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import Ventas from "./components/Ventas";
import Stock from "./components/Stock";
import Reportes from "./components/Reportes";
import Login from "./components/Login";

window.addEventListener('error', e => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
    const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
    if (resizeObserverErr) {
      resizeObserverErr.setAttribute('style', 'display: none');
    }
    if (resizeObserverErrDiv) {
      resizeObserverErrDiv.setAttribute('style', 'display: none');
    }
    e.stopImmediatePropagation();
  }
});

function App() {
  const [vistaActual, setVistaActual] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    setVistaActual("dashboard");
  };

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Si es CAJERO, mostrar solo pantalla de ventas SIN navegación
  if (user.rol === "cajero") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
        {/* Header simple para cajero */}
        <div
          style={{
            background: "linear-gradient(to right, #2563eb, #1e40af)",
            color: "white",
            padding: "1rem 1.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Logo + Título */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <img 
                src="/logos/DonCharoLogo.png" 
                alt="Don Charo Logo"
                style={{
                  height: "50px",
                  width: "auto",
                  objectFit: "contain"
                }}
              />
              <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                Sistema de Ventas - Don Charo
              </h1>
            </div>

            {/* Botones de acceso rápido + User Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* Botón Claro */}
              <a
                href="https://clarocomercios.claro.com.ar/main/recargas"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#dc2626")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#ef4444")
                }
              >
                <img
                  src="/logos/claro-logo.png" 
                  alt="Claro"
                  style={{
                    width: "18px",
                    height: "18px",
                    objectFit: "contain",
                  }}
                />
                <Smartphone size={16} style={{ display: "none" }} />
                Claro
              </a>

              {/* Botón AFIP */}
              <a
                href="https://www.afip.gob.ar"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#0891b2",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#0e7490")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#0891b2")
                }
              >
                <img
                  src="https://www.afip.gob.ar/images/logos/afip-blanco.svg"
                  alt="AFIP"
                  style={{
                    width: "20px",
                    height: "20px",
                    filter: "brightness(0) invert(1)",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "inline";
                  }}
                />
                <FileText size={16} style={{ display: "none" }} />
                ARCA
              </a>

              {/* User Info */}
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <UserIcon size={18} />
                  <span style={{ fontWeight: 600 }}>
                    {user.nombre_completo || user.username}
                  </span>
                </div>
              </div>

              {/* Botón Salir */}
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "rgba(255,255,255,0.3)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "rgba(255,255,255,0.2)")
                }
              >
                <LogOut size={16} />
                Salir
              </button>
            </div>
          </div>
        </div>

        {/* Contenido - Solo Ventas */}
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <Ventas />
        </div>
      </div>
    );
  }

  // Si es ADMIN, mostrar con navegación completa
  const menuItems = [
    { id: "dashboard", nombre: "Inicio", icono: Home, componente: Dashboard },
    { id: "stock", nombre: "Stock", icono: Package, componente: Stock },
    {
      id: "reportes",
      nombre: "Reportes",
      icono: BarChart3,
      componente: Reportes,
    },
  ];

  const ComponenteActual = menuItems.find(
    (item) => item.id === vistaActual
  )?.componente;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(to right, #2563eb, #1e40af)",
          color: "white",
          padding: "1.5rem",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Logo + Título */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <img 
              src="/logos/DonCharoLogo.png" 
              alt="Don Charo Logo"
              style={{
                height: "60px",
                width: "auto",
                objectFit: "contain"
              }}
            />
            <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>
              Autoservicio Don Charo
            </h1>
          </div>

          {/* User Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  justifyContent: "flex-end",
                }}
              >
                <UserIcon size={20} />
                <span style={{ fontWeight: 600 }}>
                  {user.nombre_completo || user.username}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: 600,
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "rgba(255,255,255,0.3)")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "rgba(255,255,255,0.2)")
              }
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Navigation - Solo para Admin */}
      <div
        style={{
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <nav style={{ display: "flex", gap: "0.25rem" }}>
            {menuItems.map((item) => {
              const Icono = item.icono;
              const activo = vistaActual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setVistaActual(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "1rem 1.5rem",
                    fontWeight: 600,
                    border: "none",
                    backgroundColor: activo ? "#eff6ff" : "transparent",
                    color: activo ? "#1e40af" : "#6b7280",
                    borderBottom: activo
                      ? "4px solid #1e40af"
                      : "4px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!activo)
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!activo)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Icono size={20} />
                  {item.nombre}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {ComponenteActual && <ComponenteActual />}
      </div>
    </div>
  );
}

export default App;
