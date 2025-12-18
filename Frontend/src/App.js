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
  Users as UsersIcon,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import Ventas from "./components/Ventas";
import Stock from "./components/Stock";
import Reportes from "./components/Reportes";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Users from "./components/Users";
import { OfflineProvider, useOffline } from "./context/OfflineContext";
import VentasDetalle from "./components/VentasDetalle";

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

// Banner de estado offline/online
const OfflineBanner = () => {
  const { isOnline, isSyncing, ventasPendientes, triggerSync, isLoadingProducts, productosProgress } = useOffline();

  // ✅ NUEVO: Solo mostrar banner para CAJERO
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.rol !== 'CAJERO' && user.rol !== 'cajero') {
    return null; // ADMIN y SUPERADMIN no ven banner
  }

  // Mostrar banner de carga inicial de productos
  if (isLoadingProducts) {
    const percentage = productosProgress.total > 0 
      ? Math.round((productosProgress.current / productosProgress.total) * 100)
      : 0;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        padding: '0.75rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 600
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span>
            📦 Cargando productos: {productosProgress.current.toLocaleString()} / {productosProgress.total.toLocaleString()} ({percentage}%)
          </span>
        </div>
        {/* Barra de progreso */}
        <div style={{
          width: '300px',
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (isOnline && !isSyncing && ventasPendientes === 0) {
    return null; // No mostrar nada si está online y sincronizado
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: isOnline ? '#fef3c7' : '#fee2e2',
      color: isOnline ? '#92400e' : '#991b1b',
      padding: '0.75rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      fontSize: '0.875rem',
      fontWeight: 600
    }}>
      {isSyncing ? (
        <>
          <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Sincronizando datos...</span>
        </>
      ) : !isOnline ? (
        <>
          <WifiOff size={18} />
          <span>⚠️ MODO OFFLINE - Las ventas se guardarán localmente</span>
          {ventasPendientes > 0 && (
            <span style={{ 
              backgroundColor: '#991b1b', 
              color: 'white', 
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem'
            }}>
              {ventasPendientes} venta{ventasPendientes !== 1 ? 's' : ''} pendiente{ventasPendientes !== 1 ? 's' : ''}
            </span>
          )}
        </>
      ) : ventasPendientes > 0 ? (
        <>
          <Wifi size={18} />
          <span>📤 {ventasPendientes} venta{ventasPendientes !== 1 ? 's' : ''} pendiente{ventasPendientes !== 1 ? 's' : ''} de sincronizar</span>
          <button
            onClick={triggerSync}
            style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: '#92400e',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <RefreshCw size={14} />
            Sincronizar ahora
          </button>
        </>
      ) : null}
      
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Componente interno que usa el contexto
function AppContent() {
  const [vistaActual, setVistaActual] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { isOnline, ventasPendientes, precargarProductos } = useOffline(); // ✅ AGREGADO precargarProductos

  useEffect(() => {
    // Verificar si hay sesión guardada
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // ✅ MODIFICADO: Ahora es async y precarga productos para CAJERO
  const handleLoginSuccess = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);

    // ✅ NUEVO: Precargar productos SOLO si es CAJERO
    if (userData.rol === 'CAJERO' || userData.rol === 'cajero') {
      console.log('👤 Usuario CAJERO detectado - Iniciando precarga de productos...');
      
      try {
        const result = await precargarProductos();
        if (result.success) {
          console.log('✅ Productos listos para modo offline');
        } else {
          console.log('⚠️ No se pudieron precargar productos:', result.message);
        }
      } catch (error) {
        console.error('⚠️ Error en precarga:', error);
        // No es crítico, el sistema puede funcionar sin precarga
      }
    } else {
      console.log(`👤 Usuario ${userData.rol} - Modo online únicamente (sin precarga)`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    setVistaActual("dashboard");
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Si es CAJERO, mostrar solo pantalla de ventas SIN navegación
  if (user.rol === "cajero" || user.rol === "CAJERO") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
        {/* Banner de estado offline */}
        <OfflineBanner />
        
        {/* Header simple para cajero */}
        <div
          style={{
            background: "linear-gradient(to right, #2563eb, #1e40af)",
            color: "white",
            padding: "1rem 1.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            marginTop: (!isOnline || ventasPendientes > 0) ? '50px' : '0',
            transition: 'margin-top 0.3s ease'
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
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
                  Sistema de Ventas - Don Charo
                </h1>
                {!isOnline && (
                  <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.9 }}>
                    🔴 Modo Offline
                  </div>
                )}
              </div>
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

              {/* User Info - Clickeable */}
              <button
                onClick={() => setShowUserProfile(true)}
                style={{
                  textAlign: "right",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")
                }
              >
                <UserIcon size={18} />
                <span>{user.nombre_completo || user.username}</span>
              </button>

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

        {/* Modal de Perfil */}
        {showUserProfile && (
          <Profile
            onClose={() => setShowUserProfile(false)}
            currentUser={user}
            onUserUpdate={handleUserUpdate}
          />
        )}
      </div>
    );
  }

  // Si es ADMIN o SUPERADMIN, mostrar con navegación completa
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

  // Si es SUPERADMIN, agregar opciones exclusivas
  if (user.rol === "superadmin" || user.rol === "SUPERADMIN") {
    menuItems.push({
      id: "users",
      nombre: "Usuarios",
      icono: UsersIcon,
      componente: Users,
    });
    menuItems.push({
      id: "ventas",
      nombre: "Ventas",
      icono: ShoppingCart,
      componente: Ventas,
    });
  }
  
  if (user.rol === "admin" || user.rol === "ADMIN" || 
    user.rol === "superadmin" || user.rol === "SUPERADMIN") {
  menuItems.push({
    id: "ventas-detalle",
    nombre: "Detalle Ventas",
    icono: BarChart3,  // Puedes usar otro icono si prefieres
    componente: VentasDetalle,
  });
}

  const ComponenteActual = menuItems.find(
    (item) => item.id === vistaActual
  )?.componente;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* Banner de estado offline */}
      <OfflineBanner />
      
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(to right, #2563eb, #1e40af)",
          color: "white",
          padding: "0.8rem",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          marginTop: (!isOnline || ventasPendientes > 0) ? '50px' : '0',
          transition: 'margin-top 0.3s ease'
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
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
                Autoservicio Don Charo
              </h1>
              {!isOnline && (
                <div style={{ fontSize: "0.875rem", marginTop: "0.25rem", opacity: 0.9 }}>
                  🔴 Modo Offline
                </div>
              )}
            </div>
          </div>

          {/* User Info - Clickeable */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => setShowUserProfile(true)}
              style={{
                textAlign: "right",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: 600,
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")
              }
            >
              <UserIcon size={20} />
              <span>{user.nombre_completo || user.username}</span>
            </button>
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

      {/* Navigation - Para Admin y Superadmin */}
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
                    padding: "0.8rem 1.5rem",
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

      {/* Modal de Perfil */}
      {showUserProfile && (
        <Profile
          onClose={() => setShowUserProfile(false)}
          currentUser={user}
          onUserUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}

// Componente principal con Provider
function App() {
  return (
    <OfflineProvider>
      <AppContent />
    </OfflineProvider>
  );
}

export default App;